// src/services/auth.ts
const STORAGE_KEY = 'access_token';
let accessToken: string | null = null;

export const setAccessToken = (token: string | null, persist = true) => {
  accessToken = token;

  if (persist && token) {
    sessionStorage.setItem(STORAGE_KEY, token);
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
};

export const getAccessToken = () => accessToken || sessionStorage.getItem(STORAGE_KEY);

export const authFetch = async (input: RequestInfo, init: RequestInit = {}) => {
  const headers = new Headers(init.headers);
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
    credentials: 'include', // send refresh cookie if needed
  });

  if (response.status === 401) {
    // Optionally try refresh then retry
  }

  return response;
};