import PageContainer from '@/Components/PageContainer';
import ListExportButtons from '@/Components/ListExportButtons';
import ListFilterBar from '@/Components/ListFilterBar';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { defaultDateFilters, useFilteredList } from '@/hooks/useFilteredList';
import { usePageHeader } from '@/hooks/usePageHeader';
import { exportFilteredList } from '@/lib/listExport';
import { buildListFilterParams, type ListFilters } from '@/lib/listFilters';
import { resolveReturnHref } from '@/lib/invoiceReturn';
import { formatAppCreatedAt } from '@/lib/dateUtils';
import type { RouteLocation } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type RouteFilters = ListFilters;

type RoutesListData = {
    routes: { data: RouteLocation[] };
    filters: RouteFilters;
    filterSummary: string;
};

const defaultFilters: RouteFilters = {
    search: '',
    ...defaultDateFilters,
};

function useInvoiceReturn() {
    return useMemo(() => {
        const params = new URLSearchParams(window.location.search);

        return {
            return_route: params.get('return_route'),
            return_id: params.get('return_id') ? Number(params.get('return_id')) : null,
            return_label: params.get('return_label'),
        };
    }, []);
}

export default function RoutesIndex() {
    const { return_route, return_id, return_label } = useInvoiceReturn();
    const [actionError, setActionError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');

    const backHref = resolveReturnHref(return_route, return_id);

    usePageHeader(
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-800">Routes (From)</h2>
                {backHref && (
                    <Link href={backHref}>
                        <SecondaryButton type="button">
                            {return_label ??
                                (return_route?.startsWith('entrybooks.')
                                    ? 'Back to entry'
                                    : 'Back to invoice')}
                        </SecondaryButton>
                    </Link>
                )}
            </div>
            <Link href={route('routes.create')}>
                <PrimaryButton>Add Route</PrimaryButton>
            </Link>
        </div>,
    );

    const {
        data,
        filters,
        filterSummary,
        dateValue,
        loading,
        error,
        hasActiveFilters,
        applyDateChange,
        applySearch,
        clearFilters,
    } = useFilteredList<RoutesListData, RouteFilters>({
        defaultFilters,
        load: async (activeFilters) => {
            const res = await appApiPost<ApiEnvelope<RoutesListData>>(
                '/routes/routes-list',
                buildListFilterParams(activeFilters),
            );

            return {
                success: res.success,
                data: res.data,
                message: res.message,
                filters: res.data?.filters,
                filterSummary: res.data?.filterSummary,
            };
        },
    });

    const routes = data?.routes.data ?? [];

    const displayError = actionError ?? error;

    const exportFiltered = async (type: 'csv' | 'pdf') => {
        try {
            setActionError(null);
            await exportFilteredList('routes', type, { ...filters, search: searchInput });
        } catch {
            setActionError(`Could not export ${type.toUpperCase()}.`);
        }
    };

    return (
        <>
            <Head title="Routes" />

            <PageContainer className="space-y-4">
                <p className="text-sm text-gray-600">
                    Manage route / location names used in invoice and entrybook &quot;From&quot;
                    fields.
                </p>

                {displayError && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {displayError}
                    </p>
                )}

                <ListFilterBar
                    dateValue={dateValue}
                    onDateChange={applyDateChange}
                    search={{
                        value: searchInput,
                        placeholder: 'Search route name…',
                        onChange: setSearchInput,
                        onSubmit: () => applySearch(searchInput),
                    }}
                    filterSummary={filterSummary}
                    hasActiveFilters={hasActiveFilters}
                    onClear={() => {
                        setSearchInput('');
                        clearFilters();
                    }}
                    actions={
                        <ListExportButtons onExport={(type) => void exportFiltered(type)} />
                    }
                />

                {loading && !data ? (
                    <p className="text-center text-sm text-gray-500">Loading routes…</p>
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500 sm:px-6 sm:py-3">
                                        Name
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500 sm:px-6 sm:py-3">
                                        Created
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {routes.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={2}
                                            className="px-6 py-8 text-center text-gray-500"
                                        >
                                            {hasActiveFilters
                                                ? 'No routes match your filters.'
                                                : 'No routes yet.'}
                                        </td>
                                    </tr>
                                ) : (
                                    routes.map((r) => (
                                        <tr key={r.id}>
                                            <td className="px-3 py-2 sm:px-6 sm:py-3">{r.name}</td>
                                            <td className="whitespace-nowrap px-3 py-2 text-gray-600 sm:px-6 sm:py-3">
                                                {formatAppCreatedAt(r.created_at)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </PageContainer>
        </>
    );
}
