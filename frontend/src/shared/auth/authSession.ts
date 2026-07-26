import { ROLES } from '../constants/roles';
import { ROUTES } from '../constants/routes';

export type AuthSessionKind = 'public' | 'admin';

interface JwtPayload {
  sub?: string;
  email?: string;
  exp?: number;
  role?: unknown;
}

export interface AuthSession {
  kind: AuthSessionKind;
  token: string;
  subject: string | null;
  email: string | null;
  roles: string[];
  expiresAt: number;
}

const TOKEN_KEYS: Record<AuthSessionKind, string> = {
  public: 'auth_token',
  admin: 'admin_token',
};

const RETURN_TO_KEYS: Record<AuthSessionKind, string> = {
  public: 'auth_return_to',
  admin: 'admin_return_to',
};

const INTERNAL_ROLES = [
  ROLES.SYSTEM_ADMIN,
  ROLES.COURSE_MANAGER,
  ROLES.FINANCE_MANAGER,
];

export function parseAuthToken(token: string, kind: AuthSessionKind): AuthSession | null {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) {
    return null;
  }

  const roles = normalizeRoles(payload.role);
  if (roles.length === 0) {
    return null;
  }

  return {
    kind,
    token,
    subject: typeof payload.sub === 'string' ? payload.sub : null,
    email: typeof payload.email === 'string' ? payload.email : null,
    roles,
    expiresAt: payload.exp * 1000,
  };
}

export function getAuthSession(kind: AuthSessionKind): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = window.localStorage.getItem(TOKEN_KEYS[kind]);
  if (!token) {
    return null;
  }

  const session = parseAuthToken(token, kind);
  if (!session) {
    clearAuthSession(kind);
  }

  return session;
}

export function storeAuthToken(kind: AuthSessionKind, token: string): AuthSession | null {
  const session = parseAuthToken(token, kind);
  if (!session || typeof window === 'undefined') {
    return null;
  }

  window.localStorage.setItem(TOKEN_KEYS[kind], token);
  return session;
}

export function clearAuthSession(kind: AuthSessionKind) {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(TOKEN_KEYS[kind]);
  }
}

export function hasAnyRole(session: AuthSession, allowedRoles: readonly string[]) {
  return allowedRoles.some((role) => session.roles.includes(role));
}

export function getDefaultRoute(session: AuthSession) {
  if (session.kind === 'admin') {
    return hasAnyRole(session, INTERNAL_ROLES) ? ROUTES.ADMIN.DASHBOARD : '/admin/login';
  }

  if (session.roles.includes(ROLES.TEACHER)) {
    return ROUTES.TEACHER.DASHBOARD;
  }

  if (session.roles.includes(ROLES.STUDENT)) {
    return ROUTES.STUDENT.DASHBOARD;
  }

  return ROUTES.PUBLIC.HOME;
}

export function getLoginRoute(kind: AuthSessionKind) {
  return kind === 'admin' ? '/admin/login' : ROUTES.PUBLIC.LOGIN;
}

export function rememberPostLoginRoute(kind: AuthSessionKind, path: string) {
  if (typeof window !== 'undefined' && isSafeInternalPath(path)) {
    window.sessionStorage.setItem(RETURN_TO_KEYS[kind], path);
  }
}

export function consumePostLoginRoute(kind: AuthSessionKind, session: AuthSession) {
  if (typeof window === 'undefined') {
    return getDefaultRoute(session);
  }

  const key = RETURN_TO_KEYS[kind];
  const destination = peekPostLoginRoute(kind, session);
  window.sessionStorage.removeItem(key);

  return destination;
}

export function peekPostLoginRoute(kind: AuthSessionKind, session: AuthSession) {
  if (typeof window === 'undefined') {
    return getDefaultRoute(session);
  }

  const path = window.sessionStorage.getItem(RETURN_TO_KEYS[kind]);
  return path && canAccessPath(session, path) ? path : getDefaultRoute(session);
}

export function canAccessPath(session: AuthSession, path: string) {
  if (!isSafeInternalPath(path)) {
    return false;
  }

  if (path.startsWith('/admin')) {
    return session.kind === 'admin' && hasAnyRole(session, INTERNAL_ROLES);
  }

  if (session.kind !== 'public') {
    return false;
  }

  if (path.startsWith(ROUTES.TEACHER.KYC)) {
    return hasAnyRole(session, [ROLES.STUDENT, ROLES.TEACHER]);
  }

  if (path.startsWith('/teacher')) {
    return session.roles.includes(ROLES.TEACHER);
  }

  if (path.startsWith('/student')) {
    return session.roles.includes(ROLES.STUDENT);
  }

  return true;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) {
    return null;
  }

  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const bytes = Uint8Array.from(window.atob(padded), (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as JwtPayload;
  } catch {
    return null;
  }
}

function normalizeRoles(value: unknown) {
  const values = Array.isArray(value) ? value : [value];
  const roles = values.flatMap((item) =>
    typeof item === 'string' ? item.split(/[\s,]+/) : [],
  );

  return [...new Set(roles.map((role) => role.trim().toUpperCase()).filter(Boolean))];
}

function isSafeInternalPath(path: string) {
  return path.startsWith('/') && !path.startsWith('//');
}
