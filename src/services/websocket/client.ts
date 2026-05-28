import EventSource from 'react-native-sse';
import { getDefaultWebSocketUrl } from '../../config/websocket';

type MessageHandler = (payload: string) => void;
type State = 'idle' | 'connecting' | 'open' | 'closed';

class WebSocketClient {
  private socket: EventSource | null = null;
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
    const nextUrl = String(url || '').trim();
    if (!nextUrl || nextUrl === this.url) {
      return;
    }

    this.url = nextUrl;

    // If a socket is currently connecting/open to an old URL, restart so the
    // new backend-provided Railway URL takes effect immediately.
    this.disconnect();
    if (this.shouldReconnect) {
      this.connect();
    }
  }

  getState(): State {
    return this.state;
  }

  connect(): void {
    if (this.socket) {
      return;
    }

    this.clearReconnectTimer();
    this.state = 'connecting';
    try {
      const streamUrl = this.buildMercureStreamUrl(this.url);
      this.socket = new EventSource(streamUrl, {
        // Mercure public stream (anonymous subscribe) for mobile realtime updates.
        // Do not pass app JWT here: Mercure expects its own subscriber JWT format.
        headers: undefined,
        pollingInterval: 0,
      });
    } catch (error) {
      this.state = 'closed';
      this.errorHandlers.forEach(handler => handler(error));
      this.closeHandlers.forEach(handler => handler());
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectDelayMs);
      }
      return;
    }

    this.socket.addEventListener('open', () => {
      this.state = 'open';
      this.openHandlers.forEach(handler => handler());
    });

    this.socket.addEventListener('message', event => {
      const payload = typeof event.data === 'string' ? event.data : JSON.stringify(event.data ?? '');
      this.messageHandlers.forEach(handler => handler(payload));
    });

    this.socket.addEventListener('error', error => {
      this.errorHandlers.forEach(handler => handler(error));
    });

    this.socket.addEventListener('close', () => {
      this.state = 'closed';
      this.closeHandlers.forEach(handler => handler());
      this.socket = null;
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectDelayMs);
      }
    });
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.clearReconnectTimer();
    if (this.socket) {
      this.socket.removeAllEventListeners();
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
    // Mercure is one-way server->client. Keep method for UI compatibility.
    return !!message && this.state === 'open';
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

  private buildMercureStreamUrl(rawUrl: string): string {
    const base = rawUrl.includes('/.well-known/mercure')
      ? rawUrl
      : `${rawUrl.replace(/\/$/, '')}/.well-known/mercure`;

    const sep = base.includes('?') ? '&' : '?';
    const topics = [
      'order_status_changed',
      'order_placed',
      'catalog_changed',
    ]
      .map(topic => `topic=${encodeURIComponent(topic)}`)
      .join('&');

    return `${base}${sep}${topics}`;
  }
}

export const websocketClient = new WebSocketClient();

