import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import type { DatePickerRangeValue } from '@/Components/FormDatePicker';
import {
    buildListFilterParams,
    dateFiltersFromPicker,
    datesFromFilters,
    defaultDateFilters,
    hasActiveListFilters,
    type ListFilters,
} from '@/lib/listFilters';
import { useCallback, useEffect, useState } from 'react';

type LoadResult<TData, TFilters extends ListFilters> = {
    success: boolean;
    data?: TData;
    message?: string;
    filters?: TFilters;
    filterSummary?: string;
};

type UseFilteredListOptions<TData, TFilters extends ListFilters> = {
    defaultFilters: TFilters;
    extraFilterKeys?: string[];
    load: (filters: TFilters) => Promise<LoadResult<TData, TFilters>>;
};

export function useFilteredList<TData, TFilters extends ListFilters>({
    defaultFilters,
    extraFilterKeys = [],
    load,
}: UseFilteredListOptions<TData, TFilters>) {
    const [data, setData] = useState<TData | null>(null);
    const [filters, setFilters] = useState<TFilters>(defaultFilters);
    const [filterSummary, setFilterSummary] = useState('');
    const [dateValue, setDateValue] = useState<DatePickerRangeValue>({ startDate: null, endDate: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchList = useCallback(
        async (nextFilters?: TFilters) => {
            const activeFilters = nextFilters ?? filters;

            setLoading(true);
            setError(null);

            try {
                const result = await load(activeFilters);

                if (!result.success || !result.data) {
                    setError(result.message || 'Could not load records.');
                    return;
                }

                setData(result.data);

                if (result.filters) {
                    setFilters(result.filters);
                    setDateValue(datesFromFilters(result.filters));
                }

                if (result.filterSummary) {
                    setFilterSummary(result.filterSummary);
                }
            } catch {
                setError('Could not load records.');
            } finally {
                setLoading(false);
            }
        },
        [filters, load],
    );

    useEffect(() => {
        void fetchList();
    }, []);

    const applyFilters = (nextFilters: TFilters) => {
        setFilters(nextFilters);
        void fetchList(nextFilters);
    };

    const applyDateChange = (dates: DatePickerRangeValue) => {
        setDateValue(dates);
        applyFilters({
            ...filters,
            ...dateFiltersFromPicker(dates),
        });
    };

    const updateField = (name: keyof TFilters & string, value: string) => {
        applyFilters({
            ...filters,
            [name]: value,
        });
    };

    const applySearch = (search: string) => {
        applyFilters({
            ...filters,
            search,
        });
    };

    const clearFilters = () => {
        setDateValue({ startDate: null, endDate: null });
        applyFilters(defaultFilters);
    };

    const syncFromResponse = (responseFilters: TFilters, summary: string) => {
        setFilters(responseFilters);
        setFilterSummary(summary);
        setDateValue(datesFromFilters(responseFilters));
    };

    return {
        data,
        filters,
        filterSummary,
        dateValue,
        loading,
        error,
        hasActiveFilters: hasActiveListFilters(filters, extraFilterKeys),
        fetchList,
        applyFilters,
        applyDateChange,
        updateField,
        applySearch,
        clearFilters,
        buildParams: () => buildListFilterParams(filters),
    };
}

export { defaultDateFilters };
