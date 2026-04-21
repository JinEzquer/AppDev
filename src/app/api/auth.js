
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

    console.log(`userLogin - POST ${BASE_URL}/api/login body:`, options.body);

    const response = await fetch(`${BASE_URL}/api/login`, options);

    let data;
    try {
        data = await response.json();
    } catch (e) {
        data = null;
    }

    if (response.ok) {
        return data;
    } else {
        const message =
            (data && (data.errors?.password || data.errors?.detail || data.detail)) ||
            'Login failed';
        console.log('userLogin - failed response', { status: response.status, data });
        throw new Error(message);
    }
}

export async function getProfile(token) {
    const BASE_URL = 'http://10.0.2.2:8002';
    const options = {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    };

    try { console.log('getProfile - GET', `${BASE_URL}/api/profile`, 'using token:', token && token.slice(0,10) + '...'); } catch(e) {}

    const response = await fetch(`${BASE_URL}/api/profile`, options);
    let data;
    try {
        data = await response.json();
    } catch (e) {
        data = null;
    }

    if (response.ok) {
        console.log('getProfile - response:', data);
        return data;
    } else {
        // silent on failure (avoid noisy 404 logs)
        return null;
    }
}