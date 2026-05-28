// @ts-nocheck
import { getApiBaseUrl } from '../../utils/apiConfig';

let sessionExpiredHandler = null;

/** Register once (inside Redux Provider) to log out when JWT expires. */
export function setSessionExpiredHandler(handler) {
  sessionExpiredHandler = typeof handler === 'function' ? handler : null;
}

function formatApiError(data, status) {
  if (!data) {
    return `Request failed (${status})`;
  }

  let message = data.message || data.error || null;
  const errors = data.errors ?? data.data?.errors;

  if (errors && typeof errors === 'object') {
    const parts = Object.entries(errors).map(([key, val]) => {
      if (Array.isArray(val)) return `${key}: ${val.join(', ')}`;
      return `${key}: ${val}`;
    });
    if (parts.length) {
      message = message ? `${message}\n${parts.join('\n')}` : parts.join('\n');
    }
  }

  if (!message && typeof data.detail === 'string') {
    message = data.detail;
  }

  return message || `Request failed (${status})`;
}

export async function apiFetch(path, { method = 'GET', body, token, headers = {} } = {}) {
  const requestHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error(
      'Cannot reach the server. Keep start_server.bat running and check your connection (emulator: http://10.0.2.2:8000).',
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const err = new Error(formatApiError(data, response.status));
    err.status = response.status;
    err.data = data;

    const authFailed =
      response.status === 401 &&
      token &&
      !String(path).includes('/api/login') &&
      !String(path).includes('/api/register');

    if (authFailed) {
      err.code = 'SESSION_EXPIRED';
      try {
        sessionExpiredHandler?.();
      } catch {
        // Handler must not break the thrown error path.
      }
    }

    throw err;
  }

  return data;
}
