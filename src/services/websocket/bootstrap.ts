import { apiFetch } from '../../app/api/client';
import { websocketClient } from './client';

type RealtimeConfigResponse = {
  data?: {
    wsUrl?: string | null;
  };
};

/**
 * Fetches the production WebSocket URL from the backend (Railway) and configures
 * the app's WebSocket client at runtime.
 *
 * This avoids hardcoding the Railway WS URL in the mobile app.
 */
export async function bootstrapWebSocketFromBackend(authToken?: string | null): Promise<void> {
  try {
    const headers =
      authToken && String(authToken).trim()
        ? { Authorization: `Bearer ${String(authToken).trim()}` }
        : undefined;
    const res = (await apiFetch('/api/customer/realtime-config', {
      headers,
    })) as RealtimeConfigResponse;
    const wsUrl = res?.data?.wsUrl ? String(res.data.wsUrl).trim() : '';
    if (wsUrl) {
      websocketClient.setUrl(wsUrl);
    }
  } catch {
    // Non-fatal. We'll keep default localhost settings for dev.
  }
}

