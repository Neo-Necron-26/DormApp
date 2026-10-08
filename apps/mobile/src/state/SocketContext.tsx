import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAppSocket } from "@sfu/shared";
import type { Socket } from "socket.io-client";
import { API_BASE_URL, TOKEN_KEY } from "./api";
import { useAuth } from "./AuthContext";

const Ctx = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        socketRef.current?.disconnect();
        socketRef.current = null;
        setSocket(null);
        return;
      }
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token || cancelled) return;
      const s = createAppSocket(API_BASE_URL, token);
      socketRef.current = s;
      setSocket(s);
    })();
    return () => {
      cancelled = true;
    };
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
