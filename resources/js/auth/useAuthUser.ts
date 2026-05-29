import {
    appApiPost,
    type ApiEnvelope,
    isAppApiUnauthorized,
} from '@/api/appClient';
import { getUserApiToken, setUserApiToken } from '@/auth/authToken';
import type { User } from '@/types';
import { useCallback, useEffect, useState } from 'react';

let cachedUser: User | null = null;
let inflight: Promise<User | null> | null = null;

export function clearAuthUserCache(): void {
    cachedUser = null;
    inflight = null;
}

export function seedAuthUserCache(user: User): void {
    cachedUser = user;
}

async function fetchProfile(): Promise<User | null> {
    const token = getUserApiToken();
    if (!token) {
        clearAuthUserCache();

        return null;
    }

    try {
        const res = await appApiPost<ApiEnvelope<{ user: User }>>(
            '/profile/profile-show',
            {},
        );

        if (res.success && res.data?.user) {
            cachedUser = res.data.user;

            return res.data.user;
        }
    } catch (error) {
        if (isAppApiUnauthorized(error)) {
            setUserApiToken(null);
        }
        clearAuthUserCache();
    }

    return null;
}

export function useAuthUser() {
    const [user, setUser] = useState<User | null>(cachedUser);
    const [loading, setLoading] = useState(
        () => Boolean(getUserApiToken()) && !cachedUser,
    );

    const refresh = useCallback(async () => {
        if (!getUserApiToken()) {
            clearAuthUserCache();
            setUser(null);
            setLoading(false);

            return null;
        }

        setLoading(true);

        if (!inflight) {
            inflight = fetchProfile().finally(() => {
                inflight = null;
            });
        }

        const profile = await inflight;
        setUser(profile);
        setLoading(false);

        return profile;
    }, []);

    useEffect(() => {
        if (!getUserApiToken()) {
            setUser(null);
            setLoading(false);

            return;
        }

        if (cachedUser) {
            setUser(cachedUser);
            setLoading(false);

            return;
        }

        void refresh();
    }, [refresh]);

    return {
        user,
        isLoggedIn: Boolean(user),
        loading,
        refresh,
    };
}
