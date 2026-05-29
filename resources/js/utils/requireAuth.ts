const DEFAULT_FALLBACK = '/dashboard';

export function normalizeReturnPath(
    value: string | null | undefined,
): string | null {
    if (value == null) {
        return null;
    }

    let path = value.trim();
    if (path === '') {
        return null;
    }

    if (/^https?:\/\//i.test(path)) {
        try {
            const url = new URL(path);
            if (
                typeof window !== 'undefined' &&
                url.origin !== window.location.origin
            ) {
                return null;
            }
            path = url.pathname + url.search;
        } catch {
            return null;
        }
    }

    if (!path.startsWith('/') || path.startsWith('//')) {
        return null;
    }

    return path;
}

export function getPostAuthRedirect(
    redirect: string | null | undefined,
    fallback = DEFAULT_FALLBACK,
): string {
    return (
        normalizeReturnPath(redirect) ??
        normalizeReturnPath(fallback) ??
        DEFAULT_FALLBACK
    );
}

export function loginUrl(returnTo?: string): string {
    const path = normalizeReturnPath(returnTo);
    if (!path) {
        return route('login');
    }

    return `${route('login')}?redirect=${encodeURIComponent(path)}`;
}

export function registerUrl(returnTo?: string): string {
    const path = normalizeReturnPath(returnTo);
    if (!path) {
        return route('register');
    }

    return `${route('register')}?redirect=${encodeURIComponent(path)}`;
}
