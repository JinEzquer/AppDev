import { Platform } from 'react-native';
import { API_TARGET, RAILWAY_API_URL, type ApiTarget } from '../config/apiTarget';

export const MOBILE_API_HOST = 'http://127.0.0.1:8000';
export const ANDROID_EMULATOR_HOST = 'http://10.0.2.2:8000';
export const ANDROID_LOCAL_CANDIDATES = [ANDROID_EMULATOR_HOST, MOBILE_API_HOST] as const;
export const DESKTOP_WEBSITE_URL = 'http://127.0.0.1:8000';

export { RAILWAY_API_URL, API_TARGET };

let apiBaseUrl: string = RAILWAY_API_URL;

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}

export function isUsingRailwayApi(): boolean {
  return apiBaseUrl.replace(/\/$/, '') === RAILWAY_API_URL.replace(/\/$/, '');
}

export function isUsingEmulatorDirectHost(): boolean {
  return Platform.OS === 'android' && getApiBaseUrl() === ANDROID_EMULATOR_HOST;
}

/**
 * Google OAuth redirect must match a URL registered in Google Cloud Console.
 * Railway: add https://jean-production-dad4.up.railway.app/connect/google/check
 * Local emulator: http://127.0.0.1:8000/connect/google/check (requires adb reverse)
 */
export function getGoogleOAuthBaseUrl(): string {
  if (isUsingRailwayApi()) {
    return RAILWAY_API_URL;
  }
  if (Platform.OS === 'android') {
    return MOBILE_API_HOST;
  }
  return DESKTOP_WEBSITE_URL;
}

export async function probeGoogleOAuthHost(): Promise<boolean> {
  return probeApi(getGoogleOAuthBaseUrl());
}

export function setApiBaseUrl(url: string): void {
  apiBaseUrl = url.replace(/\/$/, '');
}

const PROBE_TIMEOUT_MS = 6000;
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 800;
const BOOT_PROBE_MAX_MS = 15000;

function getTarget(): ApiTarget {
  try {
    // Optional override: src/config/apiTarget.local.ts
    const local = require('../config/apiTarget.local');
    if (local?.API_TARGET) {
      return local.API_TARGET;
    }
    if (local?.RAILWAY_API_URL) {
      return API_TARGET;
    }
  } catch {
    // no local override
  }
  return API_TARGET;
}

function getRailwayUrl(): string {
  try {
    const local = require('../config/apiTarget.local');
    if (local?.RAILWAY_API_URL) {
      return String(local.RAILWAY_API_URL).replace(/\/$/, '');
    }
  } catch {
    // no local override
  }
  return RAILWAY_API_URL.replace(/\/$/, '');
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function probeApi(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const response = await fetch(`${url.replace(/\/$/, '')}/api/customer/products?limit=1`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);
    return response.ok;
  } catch {
    return false;
  }
}

async function resolveLocalUrl(): Promise<string> {
  if (Platform.OS !== 'android') {
    return MOBILE_API_HOST;
  }

  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
    for (const base of ANDROID_LOCAL_CANDIDATES) {
      if (await probeApi(base)) {
        return base;
      }
    }
    if (attempt < RETRY_ATTEMPTS - 1) {
      await delay(RETRY_DELAY_MS);
    }
  }

  return ANDROID_EMULATOR_HOST;
}

export async function resolveWebsiteUrl(): Promise<string> {
  const target = getTarget();
  const railway = getRailwayUrl();

  if (target === 'railway') {
    return railway;
  }

  if (target === 'local') {
    return resolveLocalUrl();
  }

  // auto: Railway production first, then local dev server
  if (await probeApi(railway)) {
    return railway;
  }
  return resolveLocalUrl();
}

export async function initApiBaseUrl(): Promise<string> {
  const target = getTarget();
  const railway = getRailwayUrl();
  const deadline = Date.now() + BOOT_PROBE_MAX_MS;
  let url = target === 'local' ? await resolveLocalUrl() : railway;

  while (Date.now() < deadline) {
    url = await resolveWebsiteUrl();
    setApiBaseUrl(url);
    if (await probeApi(url)) {
      return url;
    }
    await delay(600);
  }

  setApiBaseUrl(url);
  const hint =
    target === 'railway' || (target === 'auto' && url === railway)
      ? `Cannot reach Railway API:\n${railway}\n\nCheck Networking in your Railway project and that the service is deployed.`
      : 'Cannot reach the API.\n\n1. Run PatricksColdCut\\start_server.bat\n2. Or set API_TARGET to "railway" in src/config/apiTarget.ts';

  throw new Error(hint);
}

export function resolveAssetUrl(path?: string | null, baseUrl?: string): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = baseUrl ?? getApiBaseUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}
