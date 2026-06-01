import type { ApiEnvelope } from '@/api/apiClient';

/** Red border class when a field has a validation error. */
export function fieldInputClass(hasError: boolean, base = 'mt-1 block w-full'): string {
    return hasError ? `${base} border-red-300 focus:border-red-500 focus:ring-red-500` : base;
}

/** Parse Laravel-style validation errors from API envelope `data`. */
export function apiFieldErrors(data: unknown): Record<string, string> {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return {};
    }

    const errors: Record<string, string> = {};

    for (const [key, val] of Object.entries(data)) {
        if (Array.isArray(val) && val[0]) {
            errors[key] = String(val[0]);
        } else if (typeof val === 'string') {
            errors[key] = val;
        }
    }

    return errors;
}

export function hasApiFieldErrors(data: unknown): boolean {
    return Object.keys(apiFieldErrors(data)).length > 0;
}

type ApiErrorResponse = Pick<ApiEnvelope<unknown>, 'message' | 'data'>;

/** Map API validation errors to form field errors, with a single-field fallback. */
export function applyApiFormErrors(
    res: ApiErrorResponse,
    options: {
        fallbackField?: string;
        fallbackMessage?: string;
    } = {},
): Record<string, string> {
    const fieldErrors = apiFieldErrors(res.data);

    if (Object.keys(fieldErrors).length > 0) {
        return fieldErrors;
    }

    const { fallbackField = 'form', fallbackMessage = 'Something went wrong.' } =
        options;

    return {
        [fallbackField]: res.message || fallbackMessage,
    };
}
