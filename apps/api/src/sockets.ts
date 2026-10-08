import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { JWT_SECRET, type AuthPayload } from "./auth";
import { corsOrigin } from "./config";

let io: SocketIOServer | null = null;

export function initSockets(httpServer: HttpServer) {
  io = new SocketIOServer(httpServer, { cors: { origin: corsOrigin } });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("unauthorized"));
    try {
      const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
      socket.data.auth = payload;
      next();
    } catch (error) {
      console.error("[Sockets] Token verification failed:", error);
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const auth = socket.data.auth as AuthPayload;
    socket.join(`user:${auth.sub}`);

    socket.on("join-channel", (channelId: string) => {
      if (typeof channelId === "string") socket.join(`channel:${channelId}`);
    });
    socket.on("leave-channel", (channelId: string) => {
      if (typeof channelId === "string") socket.leave(`channel:${channelId}`);
    });
  });

  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function emitToChannel(channelId: string, event: string, payload: unknown) {
  io?.to(`channel:${channelId}`).emit(event, payload);
}
