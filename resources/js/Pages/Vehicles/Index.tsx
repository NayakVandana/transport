import ListExportButtons from '@/Components/ListExportButtons';
import ListFilterBar from '@/Components/ListFilterBar';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { defaultDateFilters, useFilteredList } from '@/hooks/useFilteredList';
import { usePageHeader } from '@/hooks/usePageHeader';
import { exportFilteredList } from '@/lib/listExport';
import { buildListFilterParams, type ListFilters } from '@/lib/listFilters';
import { invoiceReturnQuery } from '@/lib/invoiceReturn';
import type { Vehicle } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type VehicleFilters = ListFilters & {
    status?: string;
};

type VehiclesListData = {
    vehicles: { data: Vehicle[] };
    filters: VehicleFilters;
    filterSummary: string;
};

const defaultFilters: VehicleFilters = {
    search: '',
    status: '',
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

function formatDate(value?: string | null): string {
    if (!value) return '—';
    return value.slice(0, 10);
}

export default function VehiclesIndex() {
    const { return_route, return_id, return_label } = useInvoiceReturn();
    const [actionError, setActionError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');

    const backHref =
        return_route && route().has(return_route)
            ? route(
                  return_route,
                  return_id && return_route === 'invoices.edit'
                      ? { invoice: return_id }
                      : {},
              )
            : null;

    const createHref = route(
        'vehicles.create',
        return_route
            ? invoiceReturnQuery(return_route === 'invoices.edit', return_id ?? undefined)
            : {},
    );

    usePageHeader(
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-800">Vehicles</h2>
                {backHref && (
                    <Link href={backHref}>
                        <SecondaryButton type="button">
                            {return_label ?? 'Back to invoice'}
                        </SecondaryButton>
                    </Link>
                )}
            </div>
            <Link href={createHref}>
                <PrimaryButton>Add Vehicle</PrimaryButton>
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
        updateField,
        clearFilters,
        fetchList,
    } = useFilteredList<VehiclesListData, VehicleFilters>({
        defaultFilters,
        extraFilterKeys: ['status'],
        load: async (activeFilters) => {
            const res = await appApiPost<ApiEnvelope<VehiclesListData>>(
                '/vehicles/vehicles-list',
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

    const vehicles = data?.vehicles.data ?? [];

    const destroy = async (id: number) => {
        if (!confirm('Remove this vehicle from the list?')) {
            return;
        }

        const res = await appApiPost<ApiEnvelope<null>>('/vehicles/vehicle-destroy', { id });

        if (!res.success) {
            setActionError(res.message || 'Could not remove vehicle.');
            return;
        }

        await fetchList();
    };

    const displayError = actionError ?? error;

    const exportFiltered = async (type: 'csv' | 'pdf') => {
        try {
            setActionError(null);
            await exportFilteredList('vehicles', type, { ...filters, search: searchInput });
        } catch {
            setActionError(`Could not export ${type.toUpperCase()}.`);
        }
    };

    return (
        <>
            <Head title="Vehicles" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-4 sm:px-6 lg:px-8">
                    <p className="text-sm text-gray-600">
                        Manage vehicle details, insurance, and permit expiry dates. Active vehicles
                        appear in the invoice dropdown.
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
                            placeholder: 'Search number, type, brand…',
                            onChange: setSearchInput,
                            onSubmit: () => applySearch(searchInput),
                        }}
                        selects={[
                            {
                                name: 'status',
                                label: 'Status',
                                value: filters.status ?? '',
                                options: [
                                    { value: 'active', label: 'Active' },
                                    { value: 'inactive', label: 'Inactive' },
                                ],
                                onChange: (value) => updateField('status', value),
                            },
                        ]}
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
                        <p className="text-center text-sm text-gray-500">Loading vehicles…</p>
                    ) : (
                        <div className="overflow-x-auto rounded-lg bg-white shadow">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                                            Number
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                                            Type
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                                            Brand / Model
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                                            Insurance Expiry
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                                            Permit Expiry
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {vehicles.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                {hasActiveFilters
                                                    ? 'No vehicles match your filters.'
                                                    : 'No vehicles yet.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        vehicles.map((v) => (
                                            <tr key={v.id}>
                                                <td className="px-4 py-3 font-mono font-medium">
                                                    {v.vehicle_number}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    {v.vehicle_type ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    {[v.brand, v.model].filter(Boolean).join(' ') ||
                                                        '—'}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    {formatDate(v.insurance_expiry)}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    {formatDate(v.permit_expiry)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={
                                                            v.status === 'active'
                                                                ? 'text-green-700'
                                                                : 'text-gray-500'
                                                        }
                                                    >
                                                        {v.status === 'active' ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="space-x-3 px-4 py-3 text-right">
                                                    <Link
                                                        href={route('vehicles.edit', v.id)}
                                                        className="text-indigo-600 hover:underline"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => void destroy(v.id)}
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
                </div>
            </div>
        </>
    );
}
