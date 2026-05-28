import { getDefaultWebSocketUrl } from '../../config/websocket';

type MessageHandler = (payload: string) => void;
type State = 'idle' | 'connecting' | 'open' | 'closed';

class WebSocketClient {
  private socket: WebSocket | null = null;
  private url: string = getDefaultWebSocketUrl();
  private reconnectDelayMs = 3000;
  private shouldReconnect = true;
  private state: State = 'idle';
  private messageHandlers = new Set<MessageHandler>();
  private openHandlers = new Set<() => void>();
  private closeHandlers = new Set<() => void>();
  private errorHandlers = new Set<(error: unknown) => void>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  setUrl(url: string): void {
    this.url = url;
  }

  getState(): State {
    return this.state;
  }

  connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.clearReconnectTimer();
    this.state = 'connecting';
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      this.state = 'open';
      this.openHandlers.forEach(handler => handler());
    };

    this.socket.onmessage = event => {
      const payload = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
      this.messageHandlers.forEach(handler => handler(payload));
    };

    this.socket.onerror = error => {
      this.errorHandlers.forEach(handler => handler(error));
    };

    this.socket.onclose = () => {
      this.state = 'closed';
      this.closeHandlers.forEach(handler => handler());
      this.socket = null;
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectDelayMs);
      }
    };
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.clearReconnectTimer();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.state = 'closed';
  }

  enableReconnect(enabled: boolean): void {
    this.shouldReconnect = enabled;
  }

  setReconnectDelay(ms: number): void {
    this.reconnectDelayMs = ms;
  }

  send(message: string | Record<string, unknown>): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    this.socket.send(payload);
    return true;
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onOpen(handler: () => void): () => void {
    this.openHandlers.add(handler);
    return () => this.openHandlers.delete(handler);
  }

  onClose(handler: () => void): () => void {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }

  onError(handler: (error: unknown) => void): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

export const websocketClient = new WebSocketClient();

