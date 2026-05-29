export const USER_API_TOKEN_KEY = 'user_api_token';

export function getUserApiToken(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    return localStorage.getItem(USER_API_TOKEN_KEY);
}

export function setUserApiToken(token: string | null): void {
    if (typeof window === 'undefined') {
        return;
    }

    if (!token) {
        localStorage.removeItem(USER_API_TOKEN_KEY);

        return;
    }

    localStorage.setItem(USER_API_TOKEN_KEY, token);
}
