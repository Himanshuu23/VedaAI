import { authStore } from "./auth";

const WS_URL = (import.meta.env.VITE_WS_URL ?? "ws://localhost:5000") + "/ws";

export type WsMessageType =
  | "JOB_STATUS"
  | "JOB_PROGRESS"
  | "JOB_COMPLETED"
  | "JOB_FAILED";

export interface WsMessage {
  type: WsMessageType;
  jobId: string;
  assignmentId?: string;
  status?: string;
  progress?: number;
  data?: unknown;
  error?: string;
}

type Listener = (msg: WsMessage) => void;

class VedaWebSocket {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private shouldReconnect = false;

  connect(): void {
    const token = authStore.getToken();
    if (!token || typeof window === "undefined") return;

    this.shouldReconnect = true;
    this.open(token);
  }

  private open(token: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(`${WS_URL}?token=${token}`);

    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string) as WsMessage;
        this.listeners.forEach((l) => l(msg));
      } catch {
        // ignore malformed
      }
    };

    this.ws.onclose = () => {
      if (!this.shouldReconnect) return;
      this.reconnectTimer = setTimeout(() => {
        const t = authStore.getToken();
        if (t) this.open(t);
      }, this.reconnectDelay);
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    };

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
    };
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const vedaWs = new VedaWebSocket();
