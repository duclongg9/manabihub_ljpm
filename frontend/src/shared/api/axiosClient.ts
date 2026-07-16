import axios from 'axios';
import {
  clearAuthSession,
  getAuthSession,
  getLoginRoute,
  rememberPostLoginRoute,
  type AuthSessionKind,
} from '../auth/authSession';

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

axiosClient.interceptors.request.use((config) => {
  if (isLoginRequest(config.url)) {
    return config;
  }

  const session = getAuthSession(resolveSessionKind(config.url));
  if (session) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  return config;
});

let redirectingToLogin = false;

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url as string | undefined;

    if (status === 401 && !isLoginRequest(requestUrl)) {
      const kind = resolveSessionKind(requestUrl);
      clearAuthSession(kind);
      redirectToLogin(kind);
    }

    return Promise.reject(error);
  },
);

function resolveSessionKind(requestUrl?: string): AuthSessionKind {
  const path = requestUrl ?? '';
  const isAdminEndpoint = path.startsWith('/admin/') || path.startsWith('/v1/admin/');
  const isAdminScreen = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  return isAdminEndpoint || isAdminScreen ? 'admin' : 'public';
}

function isLoginRequest(requestUrl?: string) {
  return requestUrl?.includes('/admin/auth/login') ?? false;
}

function redirectToLogin(kind: AuthSessionKind) {
  if (typeof window === 'undefined' || redirectingToLogin) {
    return;
  }

  const loginRoute = getLoginRoute(kind);
  if (window.location.pathname === loginRoute) {
    return;
  }

  redirectingToLogin = true;
  rememberPostLoginRoute(kind, `${window.location.pathname}${window.location.search}`);
  window.location.assign(`${loginRoute}?reason=session-expired`);
}
