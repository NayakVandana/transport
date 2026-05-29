import axios from 'axios';
import { getUserApiToken, setUserApiToken } from '@/auth/authToken';
import { clearAuthUserCache } from '@/auth/useAuthUser';
import { loginUrl } from '@/utils/requireAuth';

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true;
window.axios.defaults.withXSRFToken = true;

axios.interceptors.request.use((config) => {
    const token = getUserApiToken();
    if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            setUserApiToken(null);
            clearAuthUserCache();

            if (!window.location.pathname.startsWith('/login')) {
                window.location.href = loginUrl(window.location.pathname);
            }
        }

        if (axios.isAxiosError(error) && error.response?.status === 419) {
            console.error('CSRF token mismatch. Refresh the page and try again.');
        }

        return Promise.reject(error);
    },
);

const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;

if (csrfToken) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}
