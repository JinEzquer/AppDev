// @ts-nocheck
import { apiFetch } from './client';

export async function userLogin({ username, password }) {
  const identifier = username.trim();
  const body = identifier.includes('@')
    ? { email: identifier, password }
    : { username: identifier, password };

  try {
    const data = await apiFetch('/api/login', { method: 'POST', body });
    const isVerified = data.user?.isVerified ?? data.user?.verified ?? false;
    return {
      token: data.token,
      user: {
        ...data.user,
        isVerified,
        verified: isVerified,
      },
      message: data.message,
    };
  } catch (error) {
    const msg = error?.message || 'Login failed';
    if (/verify/i.test(msg)) {
      const err = new Error(msg);
      err.code = 'EMAIL_NOT_VERIFIED';
      throw err;
    }
    throw error;
  }
}

export async function userRegister(payload) {
  try {
    const data = await apiFetch('/api/register', {
      method: 'POST',
      body: {
        username: payload.username,
        email: payload.email,
        password: payload.password,
        firstName: payload.firstName,
        lastName: payload.lastName,
      },
    });
    if (data?.success === false) {
      return {
        success: false,
        error: data?.message || 'Registration failed',
      };
    }
    return {
      success: true,
      data,
      message: data?.message,
      verificationEmailSent: data?.verificationEmailSent === true,
      verificationToken: data?.verificationToken,
    };
  } catch (error) {
    const data = error?.data;
    return {
      success: false,
      error: error?.message || 'Registration failed',
      code: data?.code,
      email: data?.email,
    };
  }
}

/** Poll while Verify Email screen is open — login after Gmail verify. */
export async function claimPostVerifyLogin(email) {
  return apiFetch('/api/claim-post-verify-login', {
    method: 'POST',
    body: { email: email.trim().toLowerCase() },
  });
}

/** Primary mobile path: verify (if needed) and return JWT. */
export async function mobileVerifyLogin(email, token = '') {
  const data = await apiFetch('/api/mobile-verify-login', {
    method: 'POST',
    body: {
      email: email.trim().toLowerCase(),
      token: token || '',
    },
  });
  if (!data?.token) {
    throw new Error(data?.message || 'Could not sign in after verification');
  }
  return data;
}

/** Verify email token and return JWT (mobile deep link). */
export async function verifyEmailAndLogin(token) {
  const data = await apiFetch('/api/verify-email-complete', {
    method: 'POST',
    body: { token },
  });
  if (data?.success === false) {
    throw new Error(data?.message || 'Verification failed');
  }
  return data;
}

/** Resend verification link (no login required). */
export async function resendVerificationEmail(email) {
  try {
    const data = await apiFetch('/api/resend-verification-email', {
      method: 'POST',
      body: { email: email.trim().toLowerCase() },
    });
    return {
      ...data,
      verificationEmailSent: data?.verificationEmailSent === true,
      verificationToken: data?.verificationToken,
      alreadyVerified: data?.alreadyVerified === true,
      token: data?.token,
      user: data?.user,
    };
  } catch (error) {
    if (error?.data?.accountFound === false) {
      const err = new Error(error.message || 'No account found for this email');
      err.code = 'ACCOUNT_NOT_FOUND';
      throw err;
    }
    throw error;
  }
}

