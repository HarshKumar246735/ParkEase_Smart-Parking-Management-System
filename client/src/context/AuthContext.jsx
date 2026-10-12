import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService.js';
import { TOKEN_KEY } from '../services/api.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return undefined;
    let alive = true;
    authService
      .me()
      .then((d) => alive && setUser(d.user))
      .catch(() => alive && logout())
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [logout]);

  useEffect(() => {
    const onExpired = () => logout();
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [logout]);

  const applyAuth = useCallback((data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(async (body) => applyAuth(await authService.login(body)), [applyAuth]);
  const register = useCallback(async (body) => applyAuth(await authService.register(body)), [applyAuth]);
  const updateUser = useCallback((u) => setUser(u), []);

  const value = useMemo(() => ({ user, loading, isAdmin: user?.role === 'ADMIN', login, register, logout, updateUser }), [user, loading, login, register, logout, updateUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
