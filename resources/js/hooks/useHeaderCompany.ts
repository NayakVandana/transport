import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { getUserApiToken } from '@/auth/authToken';
import type { Company } from '@/types/transport';
import { useCallback, useEffect, useState } from 'react';

let cachedCompany: Company | null | undefined;
let inflight: Promise<Company | null> | null = null;

export function clearHeaderCompanyCache(): void {
    cachedCompany = undefined;
    inflight = null;
}

async function fetchCompany(): Promise<Company | null> {
    if (!getUserApiToken()) {
        cachedCompany = null;

        return null;
    }

    try {
        const res = await appApiPost<ApiEnvelope<{ company: Company | null }>>(
            '/company/company-show',
            {},
        );

        if (res.success) {
            cachedCompany = res.data?.company ?? null;

            return cachedCompany;
        }
    } catch {
        cachedCompany = null;
    }

    return null;
}

export function useHeaderCompany() {
    const [company, setCompany] = useState<Company | null | undefined>(cachedCompany);
    const [loading, setLoading] = useState(
        () => Boolean(getUserApiToken()) && cachedCompany === undefined,
    );

    const refresh = useCallback(async () => {
        if (!getUserApiToken()) {
            cachedCompany = null;
            setCompany(null);
            setLoading(false);

            return null;
        }

        setLoading(true);

        if (!inflight) {
            inflight = fetchCompany().finally(() => {
                inflight = null;
            });
        }

        const profile = await inflight;
        setCompany(profile);
        setLoading(false);

        return profile;
    }, []);

    useEffect(() => {
        if (!getUserApiToken()) {
            setCompany(null);
            setLoading(false);

            return;
        }

        if (cachedCompany !== undefined) {
            setCompany(cachedCompany);
            setLoading(false);

            return;
        }

        void refresh();
    }, [refresh]);

    return { company: company ?? null, loading, refresh };
}
