import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService.js';
import { setCsrfToken } from '../services/api.js';

const AuthContext = createContext(null);

/**
 * Session state for the whole application.
 *
 * The browser never stores credentials: the session lives in an httpOnly cookie
 * and this provider simply remembers what the server says about it. On every
 * page load it re-checks /api/auth/me, so a refresh keeps the user signed in and
 * a revoked session is noticed immediately.
 */
export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null });

  const applySession = useCallback((payload) => {
    setCsrfToken(payload?.csrfToken ?? null);
    setState({
      status: payload?.user ? 'authenticated' : 'anonymous',
      user: payload?.user ?? null,
    });
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const session = await authService.me();
      applySession(session);
      return session.user;
    } catch {
      // A failed check means "not signed in", not a broken app: protected pages
      // will redirect to sign-in.
      setCsrfToken(null);
      setState({ status: 'anonymous', user: null });
      return null;
    }
  }, [applySession]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(
    async (credentials) => {
      const session = await authService.login(credentials);
      applySession(session);
      return session.user;
    },
    [applySession],
  );

  const register = useCallback(
    async (payload) => {
      const session = await authService.register(payload);
      applySession(session);
      return session.user;
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      // Even if the network call fails, drop the local identity so the UI cannot
      // keep showing private data it no longer has a session for.
      setCsrfToken(null);
      setState({ status: 'anonymous', user: null });
    }
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      isAuthenticated: state.status === 'authenticated',
      login,
      register,
      logout,
      refreshSession,
    }),
    [state, login, register, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider.');
  return context;
}

export default AuthContext;
