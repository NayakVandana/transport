import type { DatePickerRangeValue } from '@/Components/FormDatePicker';
import {
    buildBookingFilterParams,
    type BookingDateRange,
} from '@/lib/bookingDateFilter';

export type { BookingDateRange };
export type DateFilters = {
    date_range: BookingDateRange;
    date_from?: string;
    date_to?: string;
};

export type ListFilters = DateFilters & {
    search?: string;
    [key: string]: string | undefined;
};

export const defaultDateFilters: DateFilters = {
    date_range: 'all',
    date_from: '',
    date_to: '',
};

export function datesFromFilters(filters: DateFilters): DatePickerRangeValue {
    if (filters.date_range === 'all' || !filters.date_from) {
        return { startDate: null, endDate: null };
    }

    return {
        startDate: filters.date_from,
        endDate: filters.date_to || filters.date_from,
    };
}

export function dateFiltersFromPicker(dates: DatePickerRangeValue): DateFilters {
    if (!dates.startDate) {
        return defaultDateFilters;
    }

    return {
        date_range: 'custom',
        date_from: dates.startDate,
        date_to: dates.endDate ?? dates.startDate,
    };
}

export function buildListFilterParams(filters: ListFilters): Record<string, string> {
    const params = buildBookingFilterParams({
        vehicle_id: '',
        date_range: filters.date_range,
        date_from: filters.date_from,
        date_to: filters.date_to,
    });

    for (const [key, value] of Object.entries(filters)) {
        if (key === 'date_range' || key === 'date_from' || key === 'date_to') {
            continue;
        }

        if (value) {
            params[key] = value;
        }
    }

    return params;
}

export function hasActiveListFilters(
    filters: ListFilters,
    extraKeys: string[] = [],
): boolean {
    if (filters.search) {
        return true;
    }

    if (filters.date_range !== 'all') {
        return true;
    }

    for (const key of extraKeys) {
        if (filters[key]) {
            return true;
        }
    }

    return false;
}
