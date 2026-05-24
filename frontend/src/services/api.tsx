import axios from 'axios';
import { getAccessToken, setAccessToken } from './auth';

const apiBaseUrl = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        Accept: 'application/json',
    },
    withCredentials: true,
});

// 🔐 REQUEST INTERCEPTOR
api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        const activeTenantUuid = localStorage.getItem('active_tenant_uuid');
        if (activeTenantUuid) {
            config.headers = config.headers || {};
            config.headers['X-Tenant-UUID'] = activeTenantUuid;
        }

        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        } else if (config.data instanceof URLSearchParams) {
            config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        } else {
            config.headers['Content-Type'] = 'application/json';
        }

        return config;
    },
    (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// 🔄 RESPONSE INTERCEPTOR
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh');

        if (error.response?.status === 401) {
            if (isRefreshRequest) {
                // Refresh failed; avoid recursive retry and sign the user out.
                logoutIfTokenExpired();
                return Promise.reject(error);
            }

            if (!originalRequest._retry) {
                if (isRefreshing) {
                    return new Promise(function (resolve, reject) {
                        failedQueue.push({ resolve, reject });
                    })
                        .then((token) => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            return api(originalRequest);
                        })
                        .catch((err) => Promise.reject(err));
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    const res = await api.post('/auth/refresh', {});
                    const newAccessToken = res.data.access_token;

                    setAccessToken(newAccessToken);
                    processQueue(null, newAccessToken);

                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                } catch (err) {
                    processQueue(err, null);
                    logoutIfTokenExpired();
                    return Promise.reject(err);
                } finally {
                    isRefreshing = false;
                }
            }
        }

        return Promise.reject(error);
    }
);

const logoutIfTokenExpired = async () => {
    try {
        await axios.post(`${import.meta.env.VITE_API_URL}/auth/logout`, {}, {
            withCredentials: true,
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    // Clear memory token
    setAccessToken(null);
    window.location.href = '/login';
};

export default api;