import { AppState, Linking } from 'react-native';
import { verifyEmailAndLogin } from '../app/api/auth';

/** Must match AndroidManifest intent-filter and email link from the server. */
export const EMAIL_VERIFY_REDIRECT = 'ezquerdev://verify-email';

function parseQueryString(search: string): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = search.startsWith('?') ? search.slice(1) : search;
  if (!raw) {
    return out;
  }
  for (const part of raw.split('&')) {
    const [key, value] = part.split('=');
    if (key) {
      out[decodeURIComponent(key)] = decodeURIComponent(value ?? '');
    }
  }
  return out;
}

function parseVerifyUrl(url: string): { token?: string; jwt?: string; email?: string } | null {
  if (!url) {
    return null;
  }

  if (url.startsWith(EMAIL_VERIFY_REDIRECT)) {
    const qIndex = url.indexOf('?');
    const params = parseQueryString(qIndex >= 0 ? url.slice(qIndex) : '');
    if (params.jwt) {
      return { jwt: params.jwt, email: params.email };
    }
    if (params.token) {
      return { token: params.token };
    }
    return null;
  }

  if (url.startsWith('intent://') && url.includes('verify-email')) {
    const beforeIntent = url.split('#Intent')[0] ?? url;
    const qIndex = beforeIntent.indexOf('?');
    const params = parseQueryString(qIndex >= 0 ? beforeIntent.slice(qIndex) : '');
    if (params.token) {
      return { token: params.token };
    }
  }

  try {
    const parsed = new URL(url);
    const jwt = parsed.searchParams.get('jwt');
    const token = parsed.searchParams.get('token');
    const email = parsed.searchParams.get('email');
    if (jwt) {
      return { jwt, email: email ?? undefined };
    }
    if (token) {
      return { token };
    }
  } catch {
    if (url.includes('jwt=')) {
      const params = parseQueryString(url.includes('?') ? url.slice(url.indexOf('?')) : `?${url.split('?')[1] || ''}`);
      if (params.jwt) {
        return { jwt: params.jwt, email: params.email };
      }
    }
    if (url.includes('token=')) {
      const match = url.match(/[?&]token=([^&#]+)/);
      if (match?.[1]) {
        return { token: decodeURIComponent(match[1]) };
      }
    }
  }

  return null;
}

function isDevVerifyHttpUrl(parsed: URL): boolean {
  const host = parsed.hostname;
  const port = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
  return (
    (host === '10.0.2.2' || host === '127.0.0.1' || host === 'localhost') &&
    port === '8000' &&
    parsed.pathname.startsWith('/verify-email')
  );
}

export function isEmailVerifyDeepLink(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith(EMAIL_VERIFY_REDIRECT)) {
    return true;
  }
  if (url.startsWith('intent://') && url.includes('verify-email')) {
    return true;
  }
  try {
    return isDevVerifyHttpUrl(new URL(url));
  } catch {
    return url.includes('/verify-email') && (url.includes('token=') || url.includes('jwt='));
  }
}

export function parseEmailVerifyDeepLink(
  url: string,
): { token?: string; jwt?: string; email?: string } | null {
  if (!isEmailVerifyDeepLink(url)) {
    return null;
  }
  return parseVerifyUrl(url);
}

export async function extractLoginFromUrl(
  url: string,
): Promise<{ token: string; user: Record<string, unknown> } | null> {
  return resolveEmailVerifyDeepLink(url);
}

export async function resolveEmailVerifyDeepLink(
  url: string,
): Promise<{ token: string; user: Record<string, unknown> } | null> {
  const parsed = parseVerifyUrl(url);
  if (!parsed) {
    return null;
  }

  if (parsed.jwt) {
    return {
      token: parsed.jwt,
      user: {
        email: parsed.email ?? '',
        verified: true,
        isVerified: true,
      },
    };
  }

  if (!parsed.token) {
    return null;
  }

  const data = await verifyEmailAndLogin(parsed.token);
  if (!data?.token) {
    throw new Error(data?.message || 'Verification failed');
  }

  return {
    token: data.token,
    user: {
      ...(data.user || {}),
      verified: true,
      isVerified: true,
    },
  };
}

export function subscribeToEmailVerifyLinks(
  onUrl: (url: string) => void,
): () => void {
  const handler = ({ url }: { url: string }) => {
    if (isEmailVerifyDeepLink(url)) {
      onUrl(url);
    }
  };

  const subscription = Linking.addEventListener('url', handler);

  const checkInitial = () => {
    Linking.getInitialURL().then(initial => {
      if (initial && isEmailVerifyDeepLink(initial)) {
        onUrl(initial);
      }
    });
  };
  checkInitial();

  const appStateSub = AppState.addEventListener('change', state => {
    if (state === 'active') {
      checkInitial();
    }
  });

  return () => {
    subscription.remove();
    appStateSub.remove();
  };
}
