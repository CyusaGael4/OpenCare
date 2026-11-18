import axios from 'axios';

/* The CSRF token is held in memory only, never persisted to storage. It is not
 * a credential by itself; it proves the request came from a page that could
 * read our own origin's response. */
let csrfToken = null;

export function setCsrfToken(token) {
  csrfToken = token ?? null;
}

export function getCsrfToken() {
  return csrfToken;
}

/*
 * All browser requests go through this instance.
 *
 * baseURL defaults to "/api", which Vite proxies to Express in development and
 * which the reverse proxy serves in production — always same-origin, so the
 * session cookie travels automatically. withCredentials is required for that
 * cookie (and for any future split-origin deployment).
 *
 * Credentials live only in the httpOnly session cookie. Nothing about the
 * session is stored in localStorage.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken;
  return config;
});

/*
 * If the session expired (or the API restarted with a new session secret) while
 * a form was open, the token the page holds is stale. Rather than making the
 * user reload, fetch a fresh token once and replay the request.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;
    const isCsrfFailure =
      error?.response?.status === 403 && error?.response?.data?.details?.code === 'CSRF_INVALID';

    if (isCsrfFailure && config && !config.__csrfRetried) {
      config.__csrfRetried = true;
      try {
        const { data } = await api.get('/auth/me');
        setCsrfToken(data?.data?.csrfToken);
        if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken;
        return api.request(config);
      } catch {
        // Fall through and surface the original failure.
      }
    }

    return Promise.reject(error);
  },
);

/** Turn any API/network failure into a message safe to show a user. */
export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const response = error?.response;

  // Field-level validation errors are rendered next to their inputs, so the
  // summary should stay generic rather than repeating one arbitrary message.
  if (Array.isArray(response?.data?.details)) {
    return response.data.message || 'Please check the highlighted fields.';
  }
  if (typeof response?.data?.message === 'string') {
    return response.data.message;
  }
  if (error?.code === 'ECONNABORTED') {
    return 'The request took too long. Please check your connection and try again.';
  }
  if (!response) {
    return 'Cannot reach the OpenCare service. Check your connection and try again.';
  }
  return fallback;
}

/** Field errors from the API, shaped for react-hook-form's setError. */
export function getFieldErrors(error) {
  const details = error?.response?.data?.details;
  if (!Array.isArray(details)) return [];
  return details.filter((detail) => detail?.field && detail?.message);
}

export default api;
