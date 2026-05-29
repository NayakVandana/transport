import { formatCompactDate, formatDateString } from '@/lib/dateUtils';

export type BookingDateRange =
    | 'today'
    | 'yesterday'
    | 'last_7_days'
    | 'last_30_days'
    | 'this_month'
    | 'last_month'
    | 'all'
    | 'custom';

export const BOOKING_DATE_PRESETS: { value: BookingDateRange; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last_7_days', label: 'Last 7 days' },
    { value: 'last_30_days', label: 'Last 30 days' },
    { value: 'this_month', label: 'This month' },
    { value: 'last_month', label: 'Last month' },
    { value: 'all', label: 'All' },
];

export function resolveBookingDates(
    dateRange: BookingDateRange,
    dateFrom = '',
    dateTo = '',
): { date_from: string; date_to: string } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (dateRange) {
        case 'today':
            return { date_from: formatDateString(today), date_to: formatDateString(today) };
        case 'yesterday': {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return { date_from: formatDateString(yesterday), date_to: formatDateString(yesterday) };
        }
        case 'last_7_days': {
            const start = new Date(today);
            start.setDate(start.getDate() - 6);
            return { date_from: formatDateString(start), date_to: formatDateString(today) };
        }
        case 'last_30_days': {
            const start = new Date(today);
            start.setDate(start.getDate() - 29);
            return { date_from: formatDateString(start), date_to: formatDateString(today) };
        }
        case 'this_month': {
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            return { date_from: formatDateString(start), date_to: formatDateString(end) };
        }
        case 'last_month': {
            const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const end = new Date(today.getFullYear(), today.getMonth(), 0);
            return { date_from: formatDateString(start), date_to: formatDateString(end) };
        }
        case 'custom': {
            if (dateFrom && dateTo && dateFrom > dateTo) {
                return { date_from: dateTo, date_to: dateFrom };
            }
            return { date_from: dateFrom, date_to: dateTo };
        }
        default:
            return { date_from: '', date_to: '' };
    }
}

export function bookingDateFilterLabel(
    dateRange: BookingDateRange,
    dateFrom = '',
    dateTo = '',
): string {
    if (dateRange === 'all') {
        return 'Select Date';
    }

    const { date_from: from, date_to: to } = resolveBookingDates(dateRange, dateFrom, dateTo);

    if (from && to) {
        return `${formatCompactDate(from)} ~ ${formatCompactDate(to)}`;
    }

    return BOOKING_DATE_PRESETS.find((preset) => preset.value === dateRange)?.label ?? 'Select Date';
}

export function buildBookingFilterParams(filters: {
    vehicle_id: string;
    date_range: BookingDateRange;
    date_from?: string;
    date_to?: string;
}): Record<string, string> {
    const params: Record<string, string> = {
        date_range: filters.date_range,
    };

    if (filters.vehicle_id) {
        params.vehicle_id = filters.vehicle_id;
    }

    if (filters.date_range === 'custom') {
        if (filters.date_from) {
            params.date_from = filters.date_from;
        }
        if (filters.date_to) {
            params.date_to = filters.date_to;
        }
    }

    return params;
}
