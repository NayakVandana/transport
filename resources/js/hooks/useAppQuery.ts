import { useCallback, useEffect, useRef, useState } from 'react';

type CacheEntry<T> = {
    data: T;
    fetchedAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export function invalidateAppQuery(key?: string): void {
    if (key === undefined) {
        cache.clear();
        inflight.clear();

        return;
    }

    for (const cacheKey of cache.keys()) {
        if (cacheKey === key || cacheKey.startsWith(`${key}:`)) {
            cache.delete(cacheKey);
        }
    }

    for (const cacheKey of inflight.keys()) {
        if (cacheKey === key || cacheKey.startsWith(`${key}:`)) {
            inflight.delete(cacheKey);
        }
    }
}

type UseAppQueryOptions = {
    enabled?: boolean;
    staleMs?: number;
};

export function useAppQuery<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: UseAppQueryOptions = {},
) {
    const { enabled = true, staleMs = 60_000 } = options;
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    const cached = enabled ? (cache.get(key) as CacheEntry<T> | undefined) : undefined;

    const [data, setData] = useState<T | null>(cached?.data ?? null);
    const [loading, setLoading] = useState(enabled && !cached);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(
        async (background = false) => {
            if (!enabled) {
                setLoading(false);

                return;
            }

            const hit = cache.get(key) as CacheEntry<T> | undefined;
            if (!background && hit && Date.now() - hit.fetchedAt < staleMs) {
                setData(hit.data);
                setLoading(false);
                setError(null);

                return;
            }

            if (!background && !hit) {
                setLoading(true);
            }

            setError(null);

            let request = inflight.get(key) as Promise<T> | undefined;

            if (!request) {
                request = fetcherRef
                    .current()
                    .then((result) => {
                        cache.set(key, {
                            data: result,
                            fetchedAt: Date.now(),
                        });

                        return result;
                    })
                    .finally(() => {
                        inflight.delete(key);
                    });

                inflight.set(key, request);
            }

            try {
                const result = await request;
                setData(result);
            } catch (err) {
                if (!background || !hit) {
                    setData(null);
                }

                setError(
                    err instanceof Error ? err.message : 'Could not load data.',
                );
            } finally {
                setLoading(false);
            }
        },
        [enabled, key, staleMs],
    );

    useEffect(() => {
        void load();
    }, [load]);

    const refresh = useCallback(async () => {
        cache.delete(key);
        inflight.delete(key);
        await load(false);
    }, [key, load]);

    return {
        data,
        loading,
        error,
        refresh,
    };
}
