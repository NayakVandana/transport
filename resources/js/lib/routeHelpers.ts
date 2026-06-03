export function formatLocationLabel(value?: string | null): string {
    return value?.trim() || '—';
}

export function formatRouteLabel(from?: string | null, to?: string | null): string {
    const fromLabel = from?.trim() || '—';
    const toLabel = to?.trim() || '—';

    if (!from?.trim() && !to?.trim()) {
        return '—';
    }

    return `${fromLabel} → ${toLabel}`;
}

export function validateRoutePair(
    from: string,
    to: string,
): Partial<{ route_from: string; route_to: string }> {
    const fromValue = from.trim();
    const toValue = to.trim();
    const errors: Partial<{ route_from: string; route_to: string }> = {};

    if (!fromValue) {
        errors.route_from = 'From location is required.';
    }

    if (!toValue) {
        errors.route_to = 'To location is required.';
    }

    if (fromValue && toValue && fromValue.localeCompare(toValue, undefined, { sensitivity: 'accent' }) === 0) {
        errors.route_to = 'To location must be different from from location.';
    }

    return errors;
}
