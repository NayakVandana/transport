import PageContainer from '@/Components/PageContainer';
import ListExportButtons from '@/Components/ListExportButtons';
import ListFilterBar from '@/Components/ListFilterBar';
import ListingMobileAction from '@/Components/ListingMobileAction';
import ListingMobileCard from '@/Components/ListingMobileCard';
import ListingTableShell from '@/Components/ListingTableShell';
import ListPageHeader from '@/Components/ListPageHeader';
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
        <ListPageHeader
            title="Drivers"
            create={{ href: route('drivers.create'), label: 'Add Driver', mobileLabel: 'Add' }}
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
                        <ListingTableShell
                            isEmpty={drivers.length === 0}
                            mobileCountLabel={`${drivers.length} driver${drivers.length === 1 ? '' : 's'}`}
                            emptyMessage={
                                hasActiveFilters
                                    ? 'No drivers match your filters.'
                                    : 'No drivers yet.'
                            }
                            mobile={drivers.map((driver, index) => (
                                <ListingMobileCard
                                    key={driver.id}
                                    index={index + 1}
                                    title={driver.name}
                                    subtitle={driver.mobile ? `Mobile: ${driver.mobile}` : 'No mobile'}
                                    headerRight={
                                        <span
                                            className={
                                                driver.status === 'active'
                                                    ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800'
                                                    : 'rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600'
                                            }
                                        >
                                            {driver.status === 'active' ? 'Active' : 'Inactive'}
                                        </span>
                                    }
                                    fields={[
                                        {
                                            label: 'License',
                                            value: driver.license_number ?? '—',
                                        },
                                        {
                                            label: 'Expiry',
                                            value: formatAppDateTime(driver.license_expiry),
                                        },
                                    ]}
                                    actions={
                                        <>
                                            <ListingMobileAction
                                                href={route('drivers.show', driver.id)}
                                                variant="primary"
                                            >
                                                View
                                            </ListingMobileAction>
                                            <ListingMobileAction
                                                href={route('drivers.edit', driver.id)}
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
                            }
                            tbody={drivers.map((driver) => (
                                <tr key={driver.id}>
                                    <td className="px-3 py-2 sm:px-6 sm:py-3 font-medium">
                                        <Link
                                            href={route('drivers.show', driver.id)}
                                            className="text-indigo-600 hover:underline"
                                        >
                                            {driver.name}
                                        </Link>
                                    </td>
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
                                            href={route('drivers.show', driver.id)}
                                            className="text-indigo-600 hover:underline"
                                        >
                                            View
                                        </Link>
                                        <Link
                                            href={route('drivers.edit', driver.id)}
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
