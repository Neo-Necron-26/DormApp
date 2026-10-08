import { io, type Socket } from "socket.io-client";
import type { AppNotification, ChatMessage } from "./types";

export interface AppSocketEvents {
  notification: (n: AppNotification) => void;
  "chat-message": (m: ChatMessage) => void;
}

export function createAppSocket(baseUrl: string, token: string): Socket {
  return io(baseUrl, { auth: { token }, transports: ["websocket"] });
}
