import axios from 'axios';

const api = axios.create({
    // baseURL: '/api', // Disabled to prevent double prefix (/api/api/...) since code already has /api
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — otomatis sisipkan token dari Redux Persist (localStorage)
api.interceptors.request.use(
    (config) => {
        try {
            const persistedState = localStorage.getItem('persist:root');
            if (persistedState) {
                const rootState = JSON.parse(persistedState);
                if (rootState?.user) {
                    const userState = JSON.parse(rootState.user);
                    const token = userState?.currentUser?.token;
                    if (token && !config.headers.Authorization) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                }
            }
        } catch (e) {
            // Gagal baca localStorage, skip — header manual tetap jalan
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for consistent error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Optional: Global error logging or redirection for 401
        // if (error.response?.status === 401) { ... }
        return Promise.reject(error);
    }
);

export default api;

