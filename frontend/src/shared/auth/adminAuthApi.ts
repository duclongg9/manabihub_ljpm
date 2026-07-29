import axios from 'axios';
import {
  clearAuthSession,
  getAdminCsrfToken,
  getAdminSessionRevision,
  getAuthSession,
  hasAdminRefreshSession,
  storeAdminRefreshMetadata,
  storeAdminSession,
  type AdminSessionCredentials,
  type AuthSession,
} from './authSession';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';
const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
  withCredentials: true,
});

const REFRESH_LOCK_KEY = 'manabihub_admin_refresh_lock';
const REFRESH_LOCK_LEASE_MS = 20_000;
const REFRESH_LOCK_WAIT_MS = 25_000;
let refreshInFlight: Promise<AuthSession | null> | null = null;
let logoutInProgress = false;

export async function refreshAdminSession(force = false) {
  if (logoutInProgress || !hasAdminRefreshSession()) {
    return null;
  }

  if (refreshInFlight) {
    return refreshInFlight;
  }

  const initialToken = getAuthSession('admin')?.token ?? null;
  refreshInFlight = withCrossTabRefreshLock(async () => {
    if (logoutInProgress || !hasAdminRefreshSession()) {
      return null;
    }

    const currentSession = getAuthSession('admin');
    const refreshedByAnotherTab = currentSession
      && currentSession.token !== initialToken;
    const comfortablyValid = currentSession
      && currentSession.expiresAt - Date.now() > 60_000;

    if (refreshedByAnotherTab || (!force && comfortablyValid)) {
      return currentSession;
    }

    const csrfToken = getAdminCsrfToken();
    if (!csrfToken) {
      return null;
    }

    const requestRevision = getAdminSessionRevision();
    try {
      const response = await refreshClient.post(
        '/admin/auth/refresh',
        {},
        { headers: { 'X-Admin-CSRF': csrfToken } },
      );
      const credentials = response.data?.data as AdminSessionCredentials | undefined;
      if (!credentials?.token || !credentials.csrfToken) {
        return null;
      }
      if (getAdminSessionRevision() !== requestRevision || !hasAdminRefreshSession()) {
        return null;
      }
      if (logoutInProgress) {
        storeAdminRefreshMetadata(credentials);
        return null;
      }
      return storeAdminSession(credentials);
    } catch (error: unknown) {
      if (
        isConfirmedInvalidSession(error)
        && getAdminSessionRevision() === requestRevision
      ) {
        clearAuthSession('admin');
      }
      return null;
    }
  })
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

export async function logoutAdminSession() {
  logoutInProgress = true;
  try {
    await withCrossTabRefreshLock(async () => {
      const csrfToken = getAdminCsrfToken();
      if (!csrfToken) {
        return;
      }
      try {
        await refreshClient.post(
          '/admin/auth/logout',
          {},
          { headers: { 'X-Admin-CSRF': csrfToken } },
        );
      } catch {
        // Local credentials are still discarded; the server-side session expires
        // naturally and cannot be refreshed without the cleared CSRF value.
      }
    });
  } catch {
    // A local lock failure must not prevent the user from discarding credentials.
  } finally {
    clearAuthSession('admin');
    logoutInProgress = false;
  }
}

async function withCrossTabRefreshLock<T>(operation: () => Promise<T>): Promise<T> {
  const lockManager = (
    navigator as Navigator & {
      locks?: {
        request: <R>(name: string, callback: () => Promise<R>) => Promise<R>;
      };
    }
  ).locks;

  return lockManager
    ? lockManager.request('manabihub-admin-refresh', operation)
    : withStorageLease(operation);
}

async function withStorageLease<T>(operation: () => Promise<T>): Promise<T> {
  const owner = createLockOwner();
  const deadline = Date.now() + REFRESH_LOCK_WAIT_MS;

  while (Date.now() < deadline) {
    const now = Date.now();
    const existing = readStorageLease();
    if (!existing || existing.expiresAt <= now) {
      window.localStorage.setItem(REFRESH_LOCK_KEY, JSON.stringify({
        owner,
        expiresAt: now + REFRESH_LOCK_LEASE_MS,
      }));
      await delay(30);
      if (readStorageLease()?.owner === owner) {
        try {
          return await operation();
        } finally {
          if (readStorageLease()?.owner === owner) {
            window.localStorage.removeItem(REFRESH_LOCK_KEY);
          }
        }
      }
    }
    await delay(80 + Math.floor(Math.random() * 40));
  }

  throw new Error('Timed out waiting for the admin refresh lock');
}

function readStorageLease(): { owner: string; expiresAt: number } | null {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(REFRESH_LOCK_KEY) ?? 'null',
    ) as { owner?: unknown; expiresAt?: unknown } | null;
    return parsed
      && typeof parsed.owner === 'string'
      && typeof parsed.expiresAt === 'number'
      ? { owner: parsed.owner, expiresAt: parsed.expiresAt }
      : null;
  } catch {
    return null;
  }
}

function createLockOwner() {
  return typeof window.crypto?.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function isConfirmedInvalidSession(error: unknown) {
  if (!axios.isAxiosError(error) || !error.response) {
    return false;
  }
  return [400, 401, 403].includes(error.response.status);
}
