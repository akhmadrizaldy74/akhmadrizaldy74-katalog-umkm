import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, auth } from "./api.js";

const AuthContext = createContext(null);

/** Status login admin dipakai bersama oleh toko & panel admin (satu portal). */
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(Boolean(auth.token));

  useEffect(() => {
    if (!auth.token) return;
    api("/api/auth/me")
      .then(setAdmin)
      .catch(() => setAdmin(null))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    const onLogout = () => setAdmin(null);
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, []);

  const login = useCallback(async (email, password) => {
    const { access_token } = await api("/api/auth/login", { method: "POST", body: { email, password } });
    auth.set(access_token);
    setAdmin(await api("/api/auth/me"));
  }, []);

  const logout = useCallback(() => {
    auth.clear();
    setAdmin(null);
  }, []);

  return <AuthContext.Provider value={{ admin, checking, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
