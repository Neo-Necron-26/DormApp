import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { createAppSocket } from "@sfu/shared";
import { API_BASE_URL, TOKEN_KEY } from "./api";
import { useAuth } from "./AuthContext";

type AppSocket = ReturnType<typeof createAppSocket>;

const Ctx = createContext<AppSocket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const socketRef = useRef<AppSocket | null>(null);

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      return;
    }
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    const s = createAppSocket(API_BASE_URL, token);
    socketRef.current = s;
    setSocket(s);
  }, [user?.id]);

  useEffect(
    () => () => {
      socketRef.current?.disconnect();
    },
    []
  );

  return <Ctx.Provider value={socket}>{children}</Ctx.Provider>;
}

export function useSocket() {
  return useContext(Ctx);
}
