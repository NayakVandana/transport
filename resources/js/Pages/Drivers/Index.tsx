import PageContainer from '@/Components/PageContainer';
import ListExportButtons from '@/Components/ListExportButtons';
import ListFilterBar from '@/Components/ListFilterBar';
import PrimaryButton from '@/Components/PrimaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { defaultDateFilters, useFilteredList } from '@/hooks/useFilteredList';
import { usePageHeader } from '@/hooks/usePageHeader';
import { exportFilteredList } from '@/lib/listExport';
import { buildListFilterParams, type ListFilters } from '@/lib/listFilters';
import { formatAppCreatedAt, formatAppDateTime } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/freightCalculator';
import type { Driver } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

type DriverFilters = ListFilters & {
    status?: string;
};

type DriversListData = {
    drivers: { data: Driver[] };
    filters: DriverFilters;
    filterSummary: string;
};

const defaultFilters: DriverFilters = {
    search: '',
    status: '',
    ...defaultDateFilters,
};

export default function DriversIndex() {
    const [actionError, setActionError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');

    usePageHeader(
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <h2 className="text-xl font-semibold text-gray-800">Drivers</h2>
            <Link href={route('drivers.create')}>
                <PrimaryButton>Add Driver</PrimaryButton>
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
    } = useFilteredList<DriversListData, DriverFilters>({
        defaultFilters,
        extraFilterKeys: ['status'],
        load: async (activeFilters) => {
            const res = await appApiPost<ApiEnvelope<DriversListData>>(
                '/drivers/drivers-list',
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

    const drivers = data?.drivers.data ?? [];

    const destroy = async (id: number) => {
        if (!confirm('Delete this driver?')) {
            return;
        }

        const res = await appApiPost<ApiEnvelope<null>>('/drivers/driver-destroy', { id });

        if (!res.success) {
            setActionError(res.message || 'Could not delete driver.');
            return;
        }

        await fetchList();
    };

    const displayError = actionError ?? error;

    const exportFiltered = async (type: 'csv' | 'pdf') => {
        try {
            setActionError(null);
            await exportFilteredList('drivers', type, { ...filters, search: searchInput });
        } catch {
            setActionError(`Could not export ${type.toUpperCase()}.`);
        }
    };

    return (
        <>
            <Head title="Drivers" />

            <PageContainer className="space-y-4">
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
                            placeholder: 'Search name, mobile, license…',
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
                        <p className="text-center text-sm text-gray-500">Loading drivers…</p>
                    ) : (
                        <div className="overflow-x-auto rounded-lg bg-white shadow">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left font-medium text-gray-500">Name</th>
                                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left font-medium text-gray-500">Mobile</th>
                                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left font-medium text-gray-500">Joining Date</th>
                                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-right font-medium text-gray-500">Salary</th>
                                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left font-medium text-gray-500">License No</th>
                                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left font-medium text-gray-500">License Expiry</th>
                                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left font-medium text-gray-500">Status</th>
                                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left font-medium text-gray-500">Created</th>
                                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-right font-medium text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {drivers.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                                                {hasActiveFilters
                                                    ? 'No drivers match your filters.'
                                                    : 'No drivers yet.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        drivers.map((driver) => (
                                            <tr key={driver.id}>
                                                <td className="px-3 py-2 sm:px-6 sm:py-3 font-medium">{driver.name}</td>
                                                <td className="px-3 py-2 sm:px-6 sm:py-3">{driver.mobile ?? '—'}</td>
                                                <td className="px-3 py-2 sm:px-6 sm:py-3">{formatAppDateTime(driver.joining_date)}</td>
                                                <td className="px-3 py-2 sm:px-6 sm:py-3 text-right">
                                                    {driver.salary != null && driver.salary !== ''
                                                        ? `₹ ${formatMoney(driver.salary)}`
                                                        : '—'}
                                                </td>
                                                <td className="px-3 py-2 sm:px-6 sm:py-3">{driver.license_number ?? '—'}</td>
                                                <td className="px-3 py-2 sm:px-6 sm:py-3">{formatAppDateTime(driver.license_expiry)}</td>
                                                <td className="px-3 py-2 sm:px-6 sm:py-3">
                                                    <span
                                                        className={
                                                            driver.status === 'active'
                                                                ? 'text-green-700'
                                                                : 'text-gray-500'
                                                        }
                                                    >
                                                        {driver.status === 'active' ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 sm:px-6 sm:py-3 whitespace-nowrap text-gray-600">
                                                    {formatAppCreatedAt(driver.created_at)}
                                                </td>
                                                <td className="space-x-3 px-3 py-2 sm:px-6 sm:py-3 text-right">
                                                    <Link
                                                        href={route('drivers.edit', driver.id)}
                                                        className="text-indigo-600 hover:underline"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => void destroy(driver.id)}
                                                        className="text-red-600 hover:underline"
                                                    >
                                                        Delete
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
