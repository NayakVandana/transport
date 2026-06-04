import PageContainer from '@/Components/PageContainer';
import ListExportButtons from '@/Components/ListExportButtons';
import ListFilterBar from '@/Components/ListFilterBar';
import ListingMobileAction from '@/Components/ListingMobileAction';
import ListingMobileCard from '@/Components/ListingMobileCard';
import ListingTableShell from '@/Components/ListingTableShell';
import PartyLink from '@/Components/PartyLink';
import ListPageHeader from '@/Components/ListPageHeader';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { defaultDateFilters, useFilteredList } from '@/hooks/useFilteredList';
import { usePageHeader } from '@/hooks/usePageHeader';
import { exportFilteredList } from '@/lib/listExport';
import { buildListFilterParams, type ListFilters } from '@/lib/listFilters';
import { formatAppCreatedAt } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/freightCalculator';
import { formatPartyMobiles } from '@/lib/partyValidation';
import type { Party } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

type PartyFilters = ListFilters;

type PartiesListData = {
    parties: { data: Party[] };
    filters: PartyFilters;
    filterSummary: string;
};

const defaultFilters: PartyFilters = {
    search: '',
    ...defaultDateFilters,
};

export default function PartiesIndex() {
    const [actionError, setActionError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');

    usePageHeader(
        <ListPageHeader
            title="Party"
            create={{
                href: route('parties.create'),
                label: 'Add Party',
                mobileLabel: 'Add',
            }}
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
    } = useFilteredList<PartiesListData, PartyFilters>({
        defaultFilters,
        load: async (activeFilters) => {
            const res = await appApiPost<ApiEnvelope<PartiesListData>>(
                '/parties/parties-list',
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

    const parties = data?.parties.data ?? [];

    const displayError = actionError ?? error;

    const exportFiltered = async (type: 'csv' | 'pdf') => {
        try {
            setActionError(null);
            await exportFilteredList('parties', type, { ...filters, search: searchInput });
        } catch {
            setActionError(`Could not export ${type.toUpperCase()}.`);
        }
    };

    return (
        <>
            <Head title="Party" />

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
                            placeholder: 'Search name or mobile…',
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
                        <p className="text-center text-sm text-gray-500">Loading party…</p>
                    ) : (
                        <ListingTableShell
                            isEmpty={parties.length === 0}
                            mobileCountLabel={`${parties.length} part${parties.length === 1 ? 'y' : 'ies'}`}
                            emptyMessage={
                                hasActiveFilters
                                    ? 'No party match your filters.'
                                    : 'No party yet.'
                            }
                            mobile={parties.map((party, index) => (
                                <ListingMobileCard
                                    key={party.id}
                                    index={index + 1}
                                    title={
                                        <PartyLink partyId={party.id} name={party.name} />
                                    }
                                    subtitle={
                                        formatPartyMobiles(party)
                                            ? `Mobile: ${formatPartyMobiles(party)}`
                                            : 'No mobile'
                                    }
                                    metric={{
                                        label: 'Outstanding',
                                        value: `₹ ${formatMoney(party.outstanding ?? 0)}`,
                                    }}
                                    fields={[
                                        {
                                            label: 'Invoices',
                                            value: party.invoice_count ?? 0,
                                        },
                                    ]}
                                    actions={
                                        <>
                                            <ListingMobileAction
                                                href={route('parties.overview', party.id)}
                                                variant="primary"
                                            >
                                                Manage
                                            </ListingMobileAction>
                                            {Number(party.outstanding ?? 0) > 0 && (
                                                <ListingMobileAction
                                                    href={`${route('invoice-payments.create')}?party=${party.id}`}
                                                    variant="success"
                                                >
                                                    Record Payment
                                                </ListingMobileAction>
                                            )}
                                            <ListingMobileAction
                                                href={`${route('parties.edit', party.id)}?return=profile`}
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
                                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-right font-medium text-gray-500">Invoices</th>
                                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-right font-medium text-gray-500">Outstanding</th>
                                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-left font-medium text-gray-500">Created</th>
                                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-right font-medium text-gray-500">Actions</th>
                                </tr>
                            }
                            tbody={parties.map((party) => (
                                <tr key={party.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 sm:px-6 sm:py-3 font-medium">
                                        <PartyLink partyId={party.id} name={party.name} />
                                    </td>
                                    <td className="px-3 py-2 sm:px-6 sm:py-3">
                                        {formatPartyMobiles(party) || '—'}
                                    </td>
                                    <td className="px-3 py-2 sm:px-6 sm:py-3 text-right">
                                        {party.invoice_count ?? 0}
                                    </td>
                                    <td className="px-3 py-2 sm:px-6 sm:py-3 text-right font-medium text-indigo-700">
                                        ₹ {formatMoney(party.outstanding ?? 0)}
                                    </td>
                                    <td className="px-3 py-2 sm:px-6 sm:py-3 whitespace-nowrap text-gray-600">
                                        {formatAppCreatedAt(party.created_at)}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 sm:px-6 sm:py-3 text-right">
                                        <Link
                                            href={route('parties.overview', party.id)}
                                            className="text-indigo-600 hover:underline"
                                        >
                                            Manage
                                        </Link>
                                        {Number(party.outstanding ?? 0) > 0 && (
                                            <>
                                                <span className="mx-2 text-gray-300">|</span>
                                                <Link
                                                    href={`${route('invoice-payments.create')}?party=${party.id}`}
                                                    className="text-green-700 hover:underline"
                                                >
                                                    Record Payment
                                                </Link>
                                            </>
                                        )}
                                        <span className="mx-2 text-gray-300">|</span>
                                        <Link
                                            href={`${route('parties.edit', party.id)}?return=profile`}
                                            className="text-gray-600 hover:underline"
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
