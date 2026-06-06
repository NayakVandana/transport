import PageContainer from '@/Components/PageContainer';
import ListFilterBar from '@/Components/ListFilterBar';
import ListingMobileAction from '@/Components/ListingMobileAction';
import ListingMobileCard from '@/Components/ListingMobileCard';
import ListingTableShell from '@/Components/ListingTableShell';
import ListPageHeader from '@/Components/ListPageHeader';
import PartyLink from '@/Components/PartyLink';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { formatAppDateTime } from '@/lib/dateUtils';
import { defaultDateFilters, useFilteredList } from '@/hooks/useFilteredList';
import { usePageHeader } from '@/hooks/usePageHeader';
import { buildListFilterParams, type ListFilters } from '@/lib/listFilters';
import { formatMoney } from '@/lib/freightCalculator';
import type { LoadingSlip, Party } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

type LoadingSlipFilters = ListFilters & { party_id?: string; status?: string };

type LoadingSlipsListData = {
    loadingSlips: { data: LoadingSlip[] };
    parties: Pick<Party, 'id' | 'name'>[];
    filters: LoadingSlipFilters;
    filterSummary: string;
};

const defaultFilters: LoadingSlipFilters = { search: '', party_id: '', status: '', ...defaultDateFilters };

export default function LoadingSlipsIndex() {
    const [searchInput, setSearchInput] = useState('');

    usePageHeader(
        <ListPageHeader
            title="Loading Slips"
            create={{ href: route('loading-slips.create'), label: 'New Slip', mobileLabel: 'New' }}
        />,
    );

    const { data, filters, filterSummary, dateValue, loading, error, hasActiveFilters, applyDateChange, applySearch, updateField, clearFilters } =
        useFilteredList<LoadingSlipsListData, LoadingSlipFilters>({
            defaultFilters,
            extraFilterKeys: ['party_id', 'status'],
            load: async (activeFilters) => {
                const res = await appApiPost<ApiEnvelope<LoadingSlipsListData>>(
                    '/loading-slips/loading-slips-list',
                    buildListFilterParams(activeFilters),
                );
                return { success: res.success, data: res.data, message: res.message, filters: res.data?.filters, filterSummary: res.data?.filterSummary };
            },
        });

    const slips = data?.loadingSlips.data ?? [];
    const parties = data?.parties ?? [];

    return (
        <>
            <Head title="Loading Slips" />
            <PageContainer className="space-y-4">
                {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

                <ListFilterBar
                    dateValue={dateValue}
                    onDateChange={applyDateChange}
                    search={{ value: searchInput, placeholder: 'Search route…', onChange: setSearchInput, onSubmit: () => applySearch(searchInput) }}
                    selects={[
                        { name: 'party_id', label: 'Party', value: filters.party_id ?? '', widthClass: 'w-[10rem]', options: parties.map((p) => ({ value: String(p.id), label: p.name })), onChange: (v) => updateField('party_id', v) },
                        { name: 'status', label: 'Status', value: filters.status ?? '', widthClass: 'w-[8rem]', options: [{ value: 'draft', label: 'Draft' }, { value: 'invoiced', label: 'Invoiced' }], onChange: (v) => updateField('status', v) },
                    ]}
                    filterSummary={filterSummary}
                    hasActiveFilters={hasActiveFilters}
                    onClear={() => { setSearchInput(''); clearFilters(); }}
                />

                {loading && !data ? (
                    <p className="text-center text-sm text-gray-500">Loading slips…</p>
                ) : (
                    <ListingTableShell
                        isEmpty={slips.length === 0}
                        mobileCountLabel={`${slips.length} slip${slips.length === 1 ? '' : 's'}`}
                        emptyMessage={hasActiveFilters ? 'No loading slips match your filters.' : 'No loading slips yet.'}
                        mobile={slips.map((slip, index) => (
                            <ListingMobileCard
                                key={slip.id}
                                index={index + 1}
                                title={formatAppDateTime(slip.slip_date)}
                                subtitle={<PartyLink partyId={slip.party_id ?? slip.party?.id} name={slip.party?.name} />}
                                metric={{ label: 'Freight', value: `₹ ${formatMoney(slip.total_freight)}` }}
                                fields={[
                                    { label: 'Route', value: [slip.route_from, slip.route_to].filter(Boolean).join(' → ') || '—' },
                                    { label: 'Status', value: slip.status === 'invoiced' ? 'Invoiced' : 'Draft' },
                                ]}
                                actions={
                                    <>
                                        <ListingMobileAction href={route('loading-slips.show', slip.id)} variant="primary">View</ListingMobileAction>
                                        {slip.status === 'draft' && <ListingMobileAction href={route('loading-slips.edit', slip.id)}>Edit</ListingMobileAction>}
                                    </>
                                }
                            />
                        ))}
                        thead={
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Party</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Route</th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Freight</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
                            </tr>
                        }
                        tbody={
                            <>
                                {slips.map((slip) => (
                                    <tr key={slip.id} className="hover:bg-gray-50">
                                        <td className="whitespace-nowrap px-4 py-3 text-sm">{formatAppDateTime(slip.slip_date, '—')}</td>
                                        <td className="px-4 py-3 text-sm"><PartyLink partyId={slip.party_id ?? slip.party?.id} name={slip.party?.name} /></td>
                                        <td className="px-4 py-3 text-sm">{[slip.route_from, slip.route_to].filter(Boolean).join(' → ') || '—'}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm">{formatMoney(slip.total_freight)}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${slip.status === 'invoiced' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {slip.status === 'invoiced' ? 'Invoiced' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                            <Link href={route('loading-slips.show', slip.id)} className="text-indigo-600 hover:text-indigo-900">View</Link>
                                            {slip.status === 'draft' && (
                                                <>
                                                    <span className="mx-2 text-gray-300">|</span>
                                                    <Link href={route('loading-slips.edit', slip.id)} className="text-indigo-600 hover:text-indigo-900">Edit</Link>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </>
                        }
                    />
                )}
            </PageContainer>
        </>
    );
}
