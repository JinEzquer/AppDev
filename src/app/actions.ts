export const USER_LOGIN = 'USER_LOGIN';
export const USER_LOGIN_REQUEST = 'USER_LOGIN_REQUEST';
export const USER_LOGIN_COMPLETE = 'USER_LOGIN_COMPLETE';
export const USER_LOGIN_ERROR = 'USER_LOGIN_ERROR';
export const RESET_USER_LOGIN = 'RESET_USER_LOGIN';
export const USER_AUTH_SYNC = 'USER_AUTH_SYNC';

export const authLogin = (payload: { username: string; password: string }) => ({
  type: USER_LOGIN,
  payload,
});

export const authLogout = () => ({
  type: RESET_USER_LOGIN,
});

/** Merge profile fields into persisted auth (e.g. after loading account). */
export const authSyncUser = (user: Record<string, unknown>) => ({
  type: USER_AUTH_SYNC,
  payload: { user },
});

export const authLoginGoogleComplete = (payload: {
  token: string;
  user: { email?: string; firstName?: string; lastName?: string };
}) => ({
  type: USER_LOGIN_COMPLETE,
  payload: {
    token: payload.token,
    user: { ...payload.user, verified: true, isVerified: true },
    message: 'Google sign-in successful',
  },
});

export const authLoginEmailVerifyComplete = (payload: {
  token: string;
  user: Record<string, unknown>;
}) => ({
  type: USER_LOGIN_COMPLETE,
  payload: {
    token: payload.token,
    user: { ...payload.user, verified: true, isVerified: true },
    message: 'Email verified — signed in',
  },
});
