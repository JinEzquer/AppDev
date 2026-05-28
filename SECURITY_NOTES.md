# Security Notes — Ezquerdev Mobile App

This file summarizes the security controls currently implemented in the project.

## 1) Authentication and session security

- Uses JWT authentication from backend `POST /api/login`.
- Protected API requests include `Authorization: Bearer <token>`.
- Central API client detects `401` for authenticated requests and triggers session-expired flow.
- On session expiry, app logs out user and redirects to sign-in screen.

## 2) Authorization boundaries

- Backend enforces role-based access for admin/staff/customer routes.
- Mobile app only uses customer API routes and does not rely on client-only checks for access.
- Critical actions (order placement, profile updates, payment operations) are validated server-side.

## 3) Notification security

- Device FCM token is registered only after permission is granted.
- FCM token is synced to backend for the authenticated customer account.
- FCM token is cleared on logout to reduce stale-token account linkage.
- Foreground notification rendering uses local notification channel with explicit app icon/channel.

## 4) Sensitive configuration handling

- Secrets are expected via environment variables (Railway), not hardcoded in app source.
- Firebase service account JSON is stored in deployment variables, not committed in repo.
- JWT and Firebase secrets are separated by service and managed at runtime.

## 5) Input validation and integrity

- Checkout validates required delivery fields and future delivery schedule.
- Backend normalizes/validates payment method values before persisting.
- Server-side validation remains source of truth for all order/payment writes.

## 6) Build/release safety

- Release APK uses signing config from local keystore properties.
- No secrets are bundled into public README examples or committed source files intentionally.

## 7) Operational recommendations

- Rotate Firebase and JWT-related secrets before final production handoff.
- Periodically clear stale FCM tokens for inactive accounts.
- Keep dependency versions updated and monitor backend logs for auth/realtime failures.

