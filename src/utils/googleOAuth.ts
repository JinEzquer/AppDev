import { Linking, Platform } from 'react-native';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import { getGoogleOAuthBaseUrl, isUsingRailwayApi, probeGoogleOAuthHost } from './apiConfig';

export const GOOGLE_AUTH_REDIRECT = 'ezquerdev://google-auth';

export function getGoogleInAppRedirectUrl(): string {
  const base = getGoogleOAuthBaseUrl().replace(/\/$/, '');
  return `${base}/mobile/oauth/callback`;
}

export function getGoogleMobileStartUrl(): string {
  const base = getGoogleOAuthBaseUrl().replace(/\/$/, '');
  return `${base}/connect/google/mobile`;
}

export function mustUseSecureBrowserForUrl(url: string): boolean {
  if (!url) return false;
  return (
    /\/connect\/google(\/mobile)?(\/staff)?(\?|$)/i.test(url) ||
    /\/mobile\/oauth\/callback/i.test(url) ||
    /accounts\.google\.com/i.test(url) ||
    /google\.com\/o\/oauth/i.test(url)
  );
}

export function googleOAuthCallbackUrl(siteBase: string, staff = false): string {
  const base = siteBase.replace(/\/$/, '');
  return staff ? `${base}/connect/google/staff/check` : `${base}/connect/google/check`;
}

export function isGoogleAuthCallbackUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('ezquerdev://google-auth')) return true;
  try {
    const parsed = new URL(url);
    return parsed.pathname.includes('/mobile/oauth/callback');
  } catch {
    return false;
  }
}

export function parseGoogleAuthRedirect(url: string): { token: string; user: Record<string, string> } | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const error = parsed.searchParams.get('error');
    if (error) {
      if (error === 'invalid_state') {
        throw new Error(
          'Google sign-in session expired. Try again, or use email + password.',
        );
      }
      if (error === 'jwt_failed') {
        throw new Error(
          'Server could not issue a login token. Set JWT_SECRET in Railway and redeploy, or use email + password.',
        );
      }
      if (error === 'server_error' || error === 'login_failed') {
        throw new Error(
          'Google sign-in failed on the server. Or use email + password.',
        );
      }
      throw new Error('Google sign-in was cancelled or failed.');
    }

    if (!isGoogleAuthCallbackUrl(url)) {
      return null;
    }

    const token = parsed.searchParams.get('token');
    if (!token) {
      return null;
    }

    return {
      token,
      user: {
        email: parsed.searchParams.get('email') ?? '',
        firstName: parsed.searchParams.get('firstName') ?? '',
        lastName: parsed.searchParams.get('lastName') ?? '',
      },
    };
  } catch (err) {
    if (err instanceof Error && (err.message.includes('Google sign-in') || err.message.includes('login token'))) {
      throw err;
    }
    return null;
  }
}

async function closeAuthBrowser(): Promise<void> {
  try {
    if (await InAppBrowser.isAvailable()) {
      await InAppBrowser.close();
    }
  } catch {
    // tab may already be closed
  }
}

function waitForGoogleAuthCallback(timeoutMs: number): {
  promise: Promise<string | null>;
  cancel: () => void;
} {
  let settled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let resolveRef: (url: string | null) => void = () => {};

  const finish = (url: string | null) => {
    if (settled) return;
    settled = true;
    if (timer) clearTimeout(timer);
    subscription.remove();
    resolveRef(url);
  };

  const subscription = Linking.addEventListener('url', ({ url }) => {
    if (isGoogleAuthCallbackUrl(url)) {
      finish(url);
    }
  });

  const promise = new Promise<string | null>(resolve => {
    resolveRef = resolve;
    Linking.getInitialURL()
      .then(url => {
        if (isGoogleAuthCallbackUrl(url)) {
          finish(url);
        }
      })
      .catch(() => {});
    timer = setTimeout(() => finish(null), timeoutMs);
  });

  return { promise, cancel: () => finish(null) };
}

function delay(ms: number): Promise<null> {
  return new Promise(resolve => setTimeout(() => resolve(null), ms));
}

export async function openGoogleOAuthInSecureBrowser(
  startUrl: string,
  redirectUrl: string = getGoogleInAppRedirectUrl(),
): Promise<{ ok: boolean; callbackUrl?: string; cancelled?: boolean }> {
  try {
    if (await InAppBrowser.isAvailable()) {
      const result = await InAppBrowser.openAuth(startUrl, redirectUrl, {
        dismissButtonStyle: 'close',
        preferredBarTintColor: '#0D1E5A',
        preferredControlTintColor: '#ffffff',
        showTitle: false,
        enableUrlBarHiding: true,
        enableDefaultShare: false,
        ephemeralWebSession: false,
        forceCloseOnRedirection: true,
        ...(Platform.OS === 'android' ? { showInRecents: false } : {}),
      });

      if (result.type === 'success' && result.url) {
        return { ok: true, callbackUrl: result.url };
      }

      return { ok: false, cancelled: result.type === 'cancel' || result.type === 'dismiss' };
    }
  } catch {
    // fall through
  }

  await Linking.openURL(startUrl);
  return { ok: false, cancelled: true };
}

export async function signInWithGoogle(): Promise<{ token: string; user: Record<string, string> }> {
  const onRailway = isUsingRailwayApi();

  if (Platform.OS === 'android' && !onRailway) {
    const reachable = await probeGoogleOAuthHost();
    if (!reachable) {
      throw new Error(
        'Google sign-in needs adb port forwarding (npm run fix:emulator-network) or use email + password.',
      );
    }
  }

  const startUrl = getGoogleMobileStartUrl();
  const bridgeUrl = getGoogleInAppRedirectUrl();
  const waiter = waitForGoogleAuthCallback(90000);

  try {
    const result = await openGoogleOAuthInSecureBrowser(startUrl, bridgeUrl);

    const resolveFromUrl = (url: string | null) => {
      if (!url) return null;
      return parseGoogleAuthRedirect(url);
    };

    let parsed = resolveFromUrl(result.callbackUrl ?? null);
    if (parsed?.token) {
      await closeAuthBrowser();
      return parsed;
    }

    // Bridge page redirects to ezquerdev:// — wait briefly after tab closes.
    const deepLinkUrl = await Promise.race([waiter.promise, delay(8000)]);
    parsed = resolveFromUrl(deepLinkUrl);
    if (parsed?.token) {
      await closeAuthBrowser();
      return parsed;
    }

    if (result.cancelled) {
      throw new Error('Google sign-in was cancelled. Or use email + password below.');
    }

    throw new Error(
      'Google sign-in did not finish automatically. Try again or use email + password below.',
    );
  } finally {
    waiter.cancel();
  }
}
