import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiError, PublicUser } from "@sfu/shared";
import { api, TOKEN_KEY } from "./api";

interface AuthCtx {
  user: PublicUser | null;
  loading: boolean;
  error: "invalid_credentials" | "account_linked" | null;
  login: (login: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  updateProfile: (patch: Partial<PublicUser>) => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthCtx["error"]>(null);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        try {
          setUser(await api.me());
        } catch {
          await AsyncStorage.removeItem(TOKEN_KEY);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (loginValue: string, password: string) => {
    setError(null);
    try {
      const res = await api.login({ login: loginValue, password });
      await AsyncStorage.setItem(TOKEN_KEY, res.token);
      setUser(res.user);
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.message === "account_linked") {
        setError("account_linked");
      } else {
        setError("invalid_credentials");
      }
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    setUser(await api.me());
  }, []);

  const updateProfile = useCallback(async (patch: Partial<PublicUser>) => {
    setUser(await api.updateMe(patch));
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, error, login, logout, refreshMe, updateProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
