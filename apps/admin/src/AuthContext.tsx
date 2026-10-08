import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ApiError, PublicUser } from "@sfu/shared";
import { api, TOKEN_KEY } from "./api";

interface AuthCtx {
  user: PublicUser | null;
  loading: boolean;
  error: string | null;
  login: (login: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        try {
          const me = await api.me();
          if (me.role !== "ADMIN") throw new Error("not admin");
          setUser(me);
        } catch {
          localStorage.removeItem(TOKEN_KEY);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (loginValue: string, password: string) => {
    setError(null);
    try {
      const res = await api.login({ login: loginValue, password });
      if (res.user.role !== "ADMIN") {
        setError("access_denied");
        return false;
      }
      localStorage.setItem(TOKEN_KEY, res.token);
      setUser(res.user);
      return true;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "unknown_error");
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, loading, error, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
