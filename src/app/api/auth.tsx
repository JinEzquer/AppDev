// @ts-nocheck
export async function userLogin({ username, password }) {
  const BASE_URL = 'http://10.0.2.2:8002';
  const options = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  };

  const response = await fetch(`${BASE_URL}/api/login`, options);
  const data = await response.json().catch(() => null);
  if (response.ok) return data;
  const message =
    (data && (data.errors?.password || data.errors?.detail || data.detail)) ||
    'Login failed';
  throw new Error(message);
}

export async function userRegister(payload) {
  const BASE_URL = 'http://10.0.2.2:8002';
  const response = await fetch(`${BASE_URL}/api/register`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);
  if (response.ok) {
    return { success: true, data };
  }
  return {
    success: false,
    error: data?.detail || data?.message || 'Registration failed',
  };
}
