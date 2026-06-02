import PageContainer from '@/Components/PageContainer';
import ListExportButtons from '@/Components/ListExportButtons';
import ListFilterBar from '@/Components/ListFilterBar';
import ListingMobileAction from '@/Components/ListingMobileAction';
import ListingMobileCard from '@/Components/ListingMobileCard';
import ListingTableShell from '@/Components/ListingTableShell';
import PartyLink from '@/Components/PartyLink';
import ListPageHeader from '@/Components/ListPageHeader';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { formatAppCreatedAt, formatAppDateTime } from '@/lib/dateUtils';
import { defaultDateFilters, useFilteredList } from '@/hooks/useFilteredList';
import { usePageHeader } from '@/hooks/usePageHeader';
import { exportFilteredList } from '@/lib/listExport';
import { buildListFilterParams, type ListFilters } from '@/lib/listFilters';
import { formatMoney } from '@/lib/freightCalculator';
import type { Entrybook, EntrybookTotals, Party, RouteLocation, Vehicle } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

type EntrybookFilters = ListFilters & {
    vehicle_id?: string;
    party_id?: string;
    route_from?: string;
};

type EntrybooksListData = {
    entrybooks: { data: Entrybook[] };
    vehicles: Pick<Vehicle, 'id' | 'vehicle_number'>[];
    routes: Pick<RouteLocation, 'id' | 'name'>[];
    parties: Pick<Party, 'id' | 'name'>[];
    filters: EntrybookFilters;
    totals: EntrybookTotals;
    filterSummary: string;
};

const defaultFilters: EntrybookFilters = {
    search: '',
    vehicle_id: '',
    party_id: '',
    route_from: '',
    ...defaultDateFilters,
};

function TotalCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg bg-white p-3 shadow">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
        </div>
    );
}

export default function EntrybooksIndex() {
    const [actionError, setActionError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');

    usePageHeader(
        <ListPageHeader
            title="Entrybook"
            create={{ href: route('entrybooks.create'), label: 'Add Entry', mobileLabel: 'Add' }}
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
    } = useFilteredList<EntrybooksListData, EntrybookFilters>({
        defaultFilters,
        extraFilterKeys: ['vehicle_id', 'party_id', 'route_from'],
        load: async (activeFilters) => {
            const res = await appApiPost<ApiEnvelope<EntrybooksListData>>(
                '/entrybooks/entrybooks-list',
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

    const entries = data?.entrybooks.data ?? [];
    const totals = data?.totals ?? { count: 0, freight: 0, advance: 0, balance: 0 };

    const displayError = actionError ?? error;

    const exportFiltered = async (type: 'csv' | 'pdf') => {
        try {
            setActionError(null);
            await exportFilteredList('entrybooks', type, { ...filters, search: searchInput });
        } catch {
            setActionError(`Could not export ${type.toUpperCase()}.`);
        }
    };

    return (
        <>
            <Head title="Entrybook" />

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
                            placeholder: 'Search entry no., party or route…',
                            onChange: setSearchInput,
                            onSubmit: () => applySearch(searchInput),
                        }}
                        selects={[
                            {
                                name: 'vehicle_id',
                                label: 'Vehicle',
                                value: filters.vehicle_id ?? '',
                                options: (data?.vehicles ?? []).map((v) => ({
                                    value: String(v.id),
                                    label: v.vehicle_number,
                                })),
                                onChange: (value) => updateField('vehicle_id', value),
                            },
                            {
                                name: 'party_id',
                                label: 'Party',
                                value: filters.party_id ?? '',
                                widthClass: 'w-[10rem]',
                                options: (data?.parties ?? []).map((p) => ({
                                    value: String(p.id),
                                    label: p.name,
                                })),
                                onChange: (value) => updateField('party_id', value),
                            },
                            {
                                name: 'route_from',
                                label: 'Route',
                                value: filters.route_from ?? '',
                                widthClass: 'w-[10rem]',
                                options: (data?.routes ?? []).map((r) => ({
                                    value: r.name,
                                    label: r.name,
                                })),
                                onChange: (value) => updateField('route_from', value),
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
                        <p className="text-center text-sm text-gray-500">Loading entries…</p>
                    ) : (
                        <>
                            {totals.count > 0 && (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <TotalCard label="Entries" value={String(totals.count)} />
                                    <TotalCard label="Freight" value={`₹ ${formatMoney(totals.freight)}`} />
                                    <TotalCard label="Advance" value={`₹ ${formatMoney(totals.advance)}`} />
                                    <TotalCard label="Balance" value={`₹ ${formatMoney(totals.balance)}`} />
                                </div>
                            )}

                            <ListingTableShell
                                isEmpty={entries.length === 0}
                                mobileCountLabel={`${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`}
                                emptyMessage={
                                    hasActiveFilters
                                        ? 'No entries match your filters.'
                                        : 'No entries yet.'
                                }
                                mobile={entries.map((entry, index) => (
                                    <ListingMobileCard
                                        key={entry.id}
                                        index={index + 1}
                                        title={
                                            <span className="font-mono">{entry.entry_number}</span>
                                        }
                                        subtitle={
                                            <PartyLink
                                                partyId={entry.party_id ?? entry.party?.id}
                                                name={entry.party?.name}
                                            />
                                        }
                                        metric={{
                                            label: 'Balance',
                                            value: `₹ ${formatMoney(entry.balance)}`,
                                        }}
                                        fields={[
                                            {
                                                label: 'Date',
                                                value: formatAppDateTime(entry.entry_date),
                                            },
                                            {
                                                label: 'Vehicle',
                                                value: entry.vehicle?.vehicle_number ?? '—',
                                            },
                                            {
                                                label: 'From',
                                                value: entry.route_from || '—',
                                            },
                                            {
                                                label: 'Freight',
                                                value: `₹ ${formatMoney(entry.freight)}`,
                                            },
                                        ]}
                                        actions={
                                            <ListingMobileAction
                                                href={route('entrybooks.edit', entry.id)}
                                                variant="primary"
                                            >
                                                Edit
                                            </ListingMobileAction>
                                        }
                                    />
                                ))}
                                thead={
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Entry No.</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Party</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Vehicle</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">From</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Freight</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Advance</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Balance</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Created</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                                    </tr>
                                }
                                tbody={entries.map((entry) => (
                                    <tr key={entry.id}>
                                        <td className="px-4 py-3 font-mono font-medium">
                                            {entry.entry_number}
                                        </td>
                                        <td className="px-4 py-3">
                                            {formatAppDateTime(entry.entry_date)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <PartyLink
                                                partyId={entry.party_id ?? entry.party?.id}
                                                name={entry.party?.name}
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-mono">
                                            {entry.vehicle?.vehicle_number ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">{entry.route_from || '—'}</td>
                                        <td className="px-4 py-3 text-right">
                                            ₹ {formatMoney(entry.freight)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            ₹ {formatMoney(entry.advance)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">
                                            ₹ {formatMoney(entry.balance)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                            {formatAppCreatedAt(entry.created_at)}
                                        </td>
                                        <td className="space-x-3 px-4 py-3 text-right">
                                            <Link
                                                href={route('entrybooks.edit', entry.id)}
                                                className="text-indigo-600 hover:underline"
                                            >
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            />
                        </>
                    )}
            </PageContainer>
        </>
    );
}
