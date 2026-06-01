import PageContainer from '@/Components/PageContainer';
import ListExportButtons from '@/Components/ListExportButtons';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import ListFilterBar from '@/Components/ListFilterBar';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { defaultDateFilters, useFilteredList } from '@/hooks/useFilteredList';
import { usePageHeader } from '@/hooks/usePageHeader';
import { apiFieldErrors, fieldInputClass, hasApiFieldErrors } from '@/lib/apiFormErrors';
import { exportFilteredList } from '@/lib/listExport';
import { validateRouteForm } from '@/lib/routeValidation';
import { buildListFilterParams, type ListFilters } from '@/lib/listFilters';
import { formatAppCreatedAt, formatAppDateTime } from '@/lib/dateUtils';
import { resolveReturnHref } from '@/lib/invoiceReturn';
import type { RouteLocation } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';

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
    const [name, setName] = useState('');
    const [processing, setProcessing] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [searchInput, setSearchInput] = useState('');

    const backHref = resolveReturnHref(return_route, return_id);

    usePageHeader(
        <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-800">Routes (From)</h2>
            {backHref && (
                <Link href={backHref}>
                    <SecondaryButton type="button">
                        {return_label ?? (return_route?.startsWith('entrybooks.') ? 'Back to entry' : 'Back to invoice')}
                    </SecondaryButton>
                </Link>
            )}
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
        fetchList,
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

    const setRouteName = (value: string) => {
        setName(value);
        setFieldErrors((prev) => {
            if (!prev.name) {
                return prev;
            }
            const next = { ...prev };
            delete next.name;
            return next;
        });
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setFieldErrors({});
        setActionError(null);

        const clientErrors = validateRouteForm({ name });
        if (Object.keys(clientErrors).length > 0) {
            setFieldErrors(clientErrors);
            return;
        }

        setProcessing(true);

        try {
            const res = await appApiPost<ApiEnvelope<{ route: RouteLocation }>>(
                '/routes/route-store',
                { name: name.trim() },
            );

            if (!res.success) {
                setFieldErrors(apiFieldErrors(res.data));
                if (!hasApiFieldErrors(res.data)) {
                    setActionError(res.message || 'Could not add route.');
                }
                return;
            }

            setName('');
            await fetchList();
        } catch {
            setActionError('Could not add route.');
        } finally {
            setProcessing(false);
        }
    };

    const destroy = async (id: number) => {
        if (!confirm('Remove this route from the list?')) {
            return;
        }

        const res = await appApiPost<ApiEnvelope<null>>('/routes/route-destroy', { id });

        if (!res.success) {
            setActionError(res.message || 'Could not remove route.');
            return;
        }

        await fetchList();
    };

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

            <PageContainer className="space-y-4" width="3xl">
                    <p className="text-sm text-gray-600">
                        Add route / location names here (e.g. J N P T / SARIGAM / 1X20). They
                        appear in the invoice &quot;From&quot; dropdown after saving.
                    </p>

                    {displayError && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {displayError}
                        </p>
                    )}

                    <form onSubmit={submit} className="rounded-lg bg-white p-4 shadow sm:p-6">
                        <h3 className="mb-4 font-medium text-gray-900">Add Route / Location</h3>
                        <div>
                            <InputLabel value="From (Route)" />
                            <TextInput
                                className={fieldInputClass(Boolean(fieldErrors.name))}
                                value={name}
                                onChange={(e) => setRouteName(e.target.value)}
                                placeholder="J N P T / SARIGAM / 1X20"
                            />
                            <InputError message={fieldErrors.name} className="mt-1" />
                        </div>
                        <PrimaryButton className="mt-4" disabled={processing}>
                            Add Route
                        </PrimaryButton>
                    </form>

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
                                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left font-medium text-gray-500">
                                            Name
                                        </th>
                                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left font-medium text-gray-500">
                                            Created
                                        </th>
                                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-right font-medium text-gray-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {routes.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={3}
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
                                                <td className="px-3 py-2 sm:px-6 sm:py-3 whitespace-nowrap text-gray-600">
                                                    {formatAppCreatedAt(r.created_at)}
                                                </td>
                                                <td className="px-3 py-2 sm:px-6 sm:py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => void destroy(r.id)}
                                                        className="text-red-600 hover:underline"
                                                    >
                                                        Remove
                                                    </button>
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
