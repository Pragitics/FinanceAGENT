import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { clearToken, getStoredToken, storeToken } from "@/core/tokenStorage";

type AuthContextValue = {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  useEffect(() => {
    if (token) {
      storeToken(token);
    } else {
      clearToken();
    }
  }, [token]);

  const login = useCallback((value: string) => {
    setToken(value);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      login,
      logout,
    }),
    [login, logout, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
