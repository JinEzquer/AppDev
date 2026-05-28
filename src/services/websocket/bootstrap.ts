import { apiFetch } from '../../app/api/client';
import { websocketClient } from './client';

type RealtimeConfigResponse = {
  data?: {
    wsUrl?: string | null;
    mercureUrl?: string | null;
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
    websocketClient.setAuthToken(authToken);
    const realtimeUrl = res?.data?.mercureUrl
      ? String(res.data.mercureUrl).trim()
      : res?.data?.wsUrl
        ? String(res.data.wsUrl).trim()
        : '';
    if (isValidRealtimeUrl(realtimeUrl)) {
      websocketClient.setUrl(realtimeUrl);
    }
  } catch {
    // Non-fatal. We'll keep default localhost settings for dev.
  }
}

function isValidRealtimeUrl(url: string): boolean {
  if (!url || /[<>]/.test(url)) {
    return false;
  }
  return /^https?:\/\/[^\s]+$/i.test(url);
}

