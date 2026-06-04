import PageContainer from '@/Components/PageContainer';
import ListExportButtons from '@/Components/ListExportButtons';
import ListFilterBar from '@/Components/ListFilterBar';
import ListingMobileAction from '@/Components/ListingMobileAction';
import ListingMobileCard from '@/Components/ListingMobileCard';
import ListingTableShell from '@/Components/ListingTableShell';
import { HeaderCreateButton } from '@/Components/ListPageHeader';
import PageHeaderBar from '@/Components/PageHeaderBar';
import SecondaryButton from '@/Components/SecondaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { defaultDateFilters, useFilteredList } from '@/hooks/useFilteredList';
import { usePageHeader } from '@/hooks/usePageHeader';
import { exportFilteredList } from '@/lib/listExport';
import { buildListFilterParams, type ListFilters } from '@/lib/listFilters';
import { formatAppCreatedAt, formatAppDateTime } from '@/lib/dateUtils';
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
        <PageHeaderBar
            layout="compact"
            title="Vehicles"
            actions={
                <>
                    {backHref ? (
                        <Link href={backHref} className="hidden shrink-0 sm:inline-flex">
                            <SecondaryButton type="button">
                                {return_label ?? 'Back to invoice'}
                            </SecondaryButton>
                        </Link>
                    ) : null}
                    <HeaderCreateButton
                        href={createHref}
                        label="Add Vehicle"
                        mobileLabel="Add"
                    />
                </>
            }
        />,
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

            <PageContainer className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Manage vehicle details, insurance, permit, and PUC expiry dates. Active
                        vehicles appear in the invoice dropdown.
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
                        <ListingTableShell
                            isEmpty={vehicles.length === 0}
                            mobileCountLabel={`${vehicles.length} vehicle${vehicles.length === 1 ? '' : 's'}`}
                            emptyMessage={
                                hasActiveFilters
                                    ? 'No vehicles match your filters.'
                                    : 'No vehicles yet.'
                            }
                            mobile={vehicles.map((v, index) => (
                                <ListingMobileCard
                                    key={v.id}
                                    index={index + 1}
                                    title={<span className="font-mono">{v.vehicle_number}</span>}
                                    subtitle={
                                        [v.vehicle_type, v.brand, v.model].filter(Boolean).join(' · ') ||
                                        'No details'
                                    }
                                    headerRight={
                                        <span
                                            className={
                                                v.status === 'active'
                                                    ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800'
                                                    : 'rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600'
                                            }
                                        >
                                            {v.status === 'active' ? 'Active' : 'Inactive'}
                                        </span>
                                    }
                                    fields={[
                                        {
                                            label: 'Insurance',
                                            value: formatAppDateTime(v.insurance_expiry),
                                        },
                                        {
                                            label: 'Permit',
                                            value: formatAppDateTime(v.permit_expiry),
                                        },
                                        {
                                            label: 'PUC',
                                            value: formatAppDateTime(v.pollution_expiry),
                                        },
                                    ]}
                                    actions={
                                        <>
                                            <ListingMobileAction
                                                href={route('vehicles.show', v.id)}
                                                variant="primary"
                                            >
                                                View
                                            </ListingMobileAction>
                                            <ListingMobileAction
                                                href={route('vehicles.edit', v.id)}
                                                variant="secondary"
                                            >
                                                Edit
                                            </ListingMobileAction>
                                        </>
                                    }
                                />
                            ))}
                            thead={
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Number</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Brand / Model</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Insurance Expiry</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Permit Expiry</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">PUC Expiry</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Created</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                                </tr>
                            }
                            tbody={vehicles.map((v) => (
                                <tr key={v.id}>
                                    <td className="px-4 py-3 font-mono font-medium">
                                        <Link
                                            href={route('vehicles.show', v.id)}
                                            className="text-indigo-600 hover:underline"
                                        >
                                            {v.vehicle_number}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{v.vehicle_type ?? '—'}</td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {[v.brand, v.model].filter(Boolean).join(' ') || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {formatAppDateTime(v.insurance_expiry)}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {formatAppDateTime(v.permit_expiry)}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {formatAppDateTime(v.pollution_expiry)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={
                                                v.status === 'active' ? 'text-green-700' : 'text-gray-500'
                                            }
                                        >
                                            {v.status === 'active' ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                        {formatAppCreatedAt(v.created_at)}
                                    </td>
                                    <td className="space-x-3 px-4 py-3 text-right">
                                        <Link
                                            href={route('vehicles.show', v.id)}
                                            className="text-indigo-600 hover:underline"
                                        >
                                            View
                                        </Link>
                                        <Link
                                            href={route('vehicles.edit', v.id)}
                                            className="text-indigo-600 hover:underline"
                                        >
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        />
                    )}
            </PageContainer>
        </>
    );
}
