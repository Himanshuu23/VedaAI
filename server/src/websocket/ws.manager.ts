import { WebSocket, WebSocketServer } from "ws";
import { IncomingMessage, Server } from "http";
import jwt from "jsonwebtoken";
import { WsMessage } from "../types";

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  isAlive: boolean;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, Set<AuthenticatedSocket>>();

  init(server: Server): void {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (socket: AuthenticatedSocket, req: IncomingMessage) => {
      socket.isAlive = true;

      const userId = this.authenticate(req);
      if (!userId) {
        socket.close(4001, "Unauthorized");
        return;
      }

      socket.userId = userId;

      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId)!.add(socket);

      socket.on("pong", () => { socket.isAlive = true; });

      socket.on("close", () => {
        const userSockets = this.clients.get(userId);
        if (userSockets) {
          userSockets.delete(socket);
          if (userSockets.size === 0) this.clients.delete(userId);
        }
      });

      socket.on("error", (err) => console.error("WS error:", err));
    });

    this.startHeartbeat();
  }

  private authenticate(req: IncomingMessage): string | null {
    try {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const token = url.searchParams.get("token");
      if (!token) return null;

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
      return decoded.id;
    } catch {
      return null;
    }
  }

  private startHeartbeat(): void {
    const interval = setInterval(() => {
      this.wss?.clients.forEach((ws) => {
        const socket = ws as AuthenticatedSocket;
        if (!socket.isAlive) {
          socket.terminate();
          return;
        }
        socket.isAlive = false;
        socket.ping();
      });
    }, 30000);

    this.wss?.on("close", () => clearInterval(interval));
  }

  sendToUser(userId: string, message: WsMessage): void {
    const sockets = this.clients.get(userId);
    if (!sockets) return;

    const payload = JSON.stringify(message);
    sockets.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payload);
      }
    });
  }

  broadcast(message: WsMessage): void {
    const payload = JSON.stringify(message);
    this.wss?.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  }
}

export const wsManager = new WebSocketManager();
