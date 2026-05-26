/** URLs where a failed load is expected during Google OAuth and should not show the error screen. */
export function isGoogleOrOAuthNavigation(url?: string | null): boolean {
  if (!url) return false;
  return /google\.com|accounts\.google|gstatic\.com|googleusercontent\.com/i.test(url);
}

export function isPatrickSiteNavigation(url?: string | null): boolean {
  if (!url) return false;
  return (
    /:(8000)\//.test(url) ||
    url.includes('127.0.0.1:8000') ||
    url.includes('10.0.2.2:8000') ||
    url.includes('localhost:8000')
  );
}
