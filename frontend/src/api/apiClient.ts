import axios from 'axios';

export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:3001';

export const getFileUrl = (url?: string | null): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
        return url;
    }
    const cleanBase = API_BASE_URL.replace(/\/+$/, '');
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBase}${cleanPath}`;
};

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    (config as any).metadata = { startTime: Date.now() };
    return config;
});

apiClient.interceptors.response.use(
    (response) => {
        const startTime = (response.config as any).metadata.startTime;
        const duration = Date.now() - startTime;
        console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
        return response;
    },
    (error) => {
        const startTime = error.config?.metadata?.startTime;
        const duration = startTime ? Date.now() - startTime : 'unknown';
        console.error(`[API ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${duration}ms`, error);
        if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;
