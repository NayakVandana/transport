import PageContainer from '@/Components/PageContainer';
import ListExportButtons from '@/Components/ListExportButtons';
import ListFilterBar from '@/Components/ListFilterBar';
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
import { resolveReturnHref } from '@/lib/invoiceReturn';
import { formatAppCreatedAt } from '@/lib/dateUtils';
import type { Location } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type LocationFilters = ListFilters;

type LocationsListData = {
    locations: { data: Location[] };
    filters: LocationFilters;
    filterSummary: string;
};

const defaultFilters: LocationFilters = {
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

export default function LocationsIndex() {
    const { return_route, return_id, return_label } = useInvoiceReturn();
    const [actionError, setActionError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');

    const backHref = resolveReturnHref(return_route, return_id);

    usePageHeader(
        <PageHeaderBar
            layout="compact"
            title="Locations"
            actions={
                <>
                    {backHref ? (
                        <Link href={backHref} className="hidden shrink-0 sm:inline-flex">
                            <SecondaryButton type="button">
                                {return_label ?? 'Back'}
                            </SecondaryButton>
                        </Link>
                    ) : null}
                    <HeaderCreateButton
                        href={route('locations.create')}
                        label="Add Location"
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
        clearFilters,
    } = useFilteredList<LocationsListData, LocationFilters>({
        defaultFilters,
        load: async (activeFilters) => {
            const res = await appApiPost<ApiEnvelope<LocationsListData>>(
                '/locations/locations-list',
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

    const locations = data?.locations.data ?? [];
    const displayError = actionError ?? error;

    const exportFiltered = async (type: 'csv' | 'pdf') => {
        try {
            setActionError(null);
            await exportFilteredList('locations', type, { ...filters, search: searchInput });
        } catch {
            setActionError(`Could not export ${type.toUpperCase()}.`);
        }
    };

    return (
        <>
            <Head title="Locations" />

            <PageContainer className="space-y-4">
                <p className="text-sm text-gray-600">
                    Manage location names used in route from/to fields.
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
                        placeholder: 'Search location…',
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
                    <p className="text-center text-sm text-gray-500">Loading locations…</p>
                ) : (
                    <ListingTableShell
                        isEmpty={locations.length === 0}
                        mobileCountLabel={`${locations.length} location${locations.length === 1 ? '' : 's'}`}
                        emptyMessage={
                            hasActiveFilters
                                ? 'No locations match your filters.'
                                : 'No locations yet.'
                        }
                        mobile={locations.map((location, index) => (
                            <ListingMobileCard
                                key={location.id}
                                index={index + 1}
                                title={location.name}
                                fields={[
                                    {
                                        label: 'Created',
                                        value: formatAppCreatedAt(location.created_at),
                                        fullWidth: true,
                                    },
                                ]}
                            />
                        ))}
                        thead={
                            <tr>
                                <th className="px-3 py-2 text-left font-medium text-gray-500 sm:px-6 sm:py-3">
                                    Location
                                </th>
                                <th className="px-3 py-2 text-left font-medium text-gray-500 sm:px-6 sm:py-3">
                                    Created
                                </th>
                            </tr>
                        }
                        tbody={locations.map((location) => (
                            <tr key={location.id}>
                                <td className="px-3 py-2 sm:px-6 sm:py-3">{location.name}</td>
                                <td className="whitespace-nowrap px-3 py-2 text-gray-600 sm:px-6 sm:py-3">
                                    {formatAppCreatedAt(location.created_at)}
                                </td>
                            </tr>
                        ))}
                    />
                )}
            </PageContainer>
        </>
    );
}
