// lib/socket/client.ts
// DEPRECATED: Use the useSocket hook instead for better React integration
// This is kept for backward compatibility only
import { io, Socket } from "socket.io-client";

let socket: Socket;

export function getSocket(userId: string, role: string): Socket {
  if (!socket) {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

    socket = io(socketUrl, {
      auth: { userId, role },
      autoConnect: true,
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null as any;
  }
}
