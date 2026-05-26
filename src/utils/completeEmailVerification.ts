import { Platform } from 'react-native';
import {
  claimPostVerifyLogin,
  mobileVerifyLogin,
  verifyEmailAndLogin,
} from '../app/api/auth';
import { resolveEmailVerifyDeepLink } from './emailVerifyDeepLink';

export function buildInAppVerifyUrl(token: string, email?: string): string {
  const host = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
  const params: Record<string, string> = { token, app: '1' };
  if (email?.includes('@')) {
    params.email = email.trim().toLowerCase();
  }
  return `http://${host}:8000/verify-email?${new URLSearchParams(params).toString()}`;
}

function extractJwtFromVerifyHtml(html: string): string | null {
  if (!html) return null;

  const patterns = [
    /ezquerdev:\/\/verify-email\?jwt=([^"'&\s<>]+)/i,
    /href="(ezquerdev:\/\/verify-email\?[^"]+)"/i,
    /jwt=([^"'&\s<>]+)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const value = match[1];
      if (value.startsWith('ezquerdev://')) {
        try {
          const parsed = new URL(value);
          const jwt = parsed.searchParams.get('jwt');
          if (jwt) return jwt;
        } catch {
          // fall through
        }
      }
      return decodeURIComponent(value);
    }
  }

  return null;
}

function loginResult(
  email: string,
  data: { token: string; user?: Record<string, unknown> },
): { token: string; user: Record<string, unknown> } {
  return {
    token: data.token,
    user: {
      ...(data.user || {}),
      email: data.user?.email || email,
      verified: true,
      isVerified: true,
    },
  };
}

/**
 * Poll only — waits until the user tapped Verify in Gmail (PC or phone).
 * Does NOT consume the verification token on the server.
 */
export async function pollPostVerifyLogin(
  email: string,
): Promise<{ token: string; user: Record<string, unknown> } | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail.includes('@')) {
    return null;
  }

  try {
    const claimed = await claimPostVerifyLogin(normalizedEmail);
    if (claimed?.ready && claimed?.token) {
      return loginResult(normalizedEmail, { token: claimed.token, user: claimed.user });
    }
  } catch {
    // Server unreachable or not verified yet
  }

  return null;
}

/** Load verify page and read JWT (manual fallback only — consumes token on server). */
async function fetchJwtFromVerifyPage(
  token: string,
  email?: string,
): Promise<{ token: string; user: Record<string, unknown> } | null> {
  const url = buildInAppVerifyUrl(token, email);
  const response = await fetch(url, { method: 'GET', headers: { Accept: 'text/html' } });
  const html = await response.text();

  const jwt = extractJwtFromVerifyHtml(html);
  if (!jwt) {
    return null;
  }

  return resolveEmailVerifyDeepLink(`ezquerdev://verify-email?jwt=${encodeURIComponent(jwt)}`);
}

/**
 * Manual "I verified" — try poll first, then token-based verify if user did not use Gmail yet.
 */
export async function completeEmailVerification(
  email: string,
  token: string | null | undefined,
): Promise<{ token: string; user: Record<string, unknown> } | null> {
  const fromPoll = await pollPostVerifyLogin(email);
  if (fromPoll?.token) {
    return fromPoll;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const trimmedToken = token?.trim() || '';

  if (trimmedToken) {
    try {
      const data = await verifyEmailAndLogin(trimmedToken);
      if (data?.token) {
        return loginResult(normalizedEmail, data);
      }
    } catch {
      // Token invalid or already used
    }

    try {
      const data = await mobileVerifyLogin(normalizedEmail, trimmedToken);
      if (data?.token) {
        return loginResult(normalizedEmail, data);
      }
    } catch {
      // Not verified yet
    }

    try {
      const fromPage = await fetchJwtFromVerifyPage(trimmedToken, normalizedEmail);
      if (fromPage?.token) {
        return fromPage;
      }
    } catch {
      // Server unreachable
    }
  }

  return null;
}

export async function extractLoginFromUrl(
  url: string | null | undefined,
): Promise<{ token: string; user: Record<string, unknown> } | null> {
  if (!url) return null;
  return resolveEmailVerifyDeepLink(url);
}
