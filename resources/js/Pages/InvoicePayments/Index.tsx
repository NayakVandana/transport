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
import { formatAppCreatedAt, formatAppDateTime } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/freightCalculator';
import type {
    InvoicePayment,
    InvoicePaymentTotals,
    Party,
} from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

type InvoicePaymentFilters = ListFilters & {
    party_id?: string;
};

type InvoicePaymentsListData = {
    invoicePayments: { data: InvoicePayment[] };
    parties: Pick<Party, 'id' | 'name'>[];
    filters: InvoicePaymentFilters;
    totals: InvoicePaymentTotals;
    filterSummary: string;
    totalOutstanding: number;
};

const defaultFilters: InvoicePaymentFilters = {
    search: '',
    party_id: '',
    ...defaultDateFilters,
};

const emptyTotals: InvoicePaymentTotals = {
    count: 0,
    amount: 0,
};

function TotalCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg bg-white p-3 shadow">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
        </div>
    );
}

export default function InvoicePaymentsIndex() {
    const [actionError, setActionError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');

    usePageHeader(
        <ListPageHeader
            title="Received Payments"
            create={{
                href: route('invoice-payments.create'),
                label: 'Record Payment',
                mobileLabel: 'Record',
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
        updateField,
        clearFilters,
    } = useFilteredList<InvoicePaymentsListData, InvoicePaymentFilters>({
        defaultFilters,
        extraFilterKeys: ['party_id'],
        load: async (activeFilters) => {
            const res = await appApiPost<ApiEnvelope<InvoicePaymentsListData>>(
                '/invoice-payments/invoice-payments-list',
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

    const rows = data?.invoicePayments.data ?? [];
    const totals = data?.totals ?? emptyTotals;
    const totalOutstanding = data?.totalOutstanding ?? 0;

    const displayError = actionError ?? error;

    const exportFiltered = async (type: 'csv' | 'pdf') => {
        try {
            setActionError(null);
            await exportFilteredList('invoice-payments', type, { ...filters, search: searchInput });
        } catch {
            setActionError(`Could not export ${type.toUpperCase()}.`);
        }
    };

    return (
        <>
            <Head title="Received Payments" />

            <PageContainer className="space-y-4">
                    {displayError && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {displayError}
                        </p>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <TotalCard
                            label="Total Outstanding"
                            value={`₹ ${formatMoney(totalOutstanding)}`}
                        />
                        <TotalCard label="Payments (filtered)" value={String(totals.count)} />
                        <TotalCard
                            label="Amount Received (filtered)"
                            value={`₹ ${formatMoney(totals.amount)}`}
                        />
                    </div>

                    <ListFilterBar
                        dateValue={dateValue}
                        onDateChange={applyDateChange}
                        search={{
                            value: searchInput,
                            placeholder: 'Search bill no., party, reference…',
                            onChange: setSearchInput,
                            onSubmit: () => applySearch(searchInput),
                        }}
                        selects={[
                            {
                                name: 'party_id',
                                label: 'Party',
                                value: filters.party_id ?? '',
                                options: (data?.parties ?? []).map((party) => ({
                                    value: String(party.id),
                                    label: party.name,
                                })),
                                onChange: (value) => updateField('party_id', value),
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
                        <p className="text-center text-sm text-gray-500">Loading payments…</p>
                    ) : (
                        <ListingTableShell
                            isEmpty={rows.length === 0}
                            mobileCountLabel={`${rows.length} payment${rows.length === 1 ? '' : 's'}`}
                            emptyMessage={
                                hasActiveFilters
                                    ? 'No payments match your filters.'
                                    : 'No payments recorded yet.'
                            }
                            mobile={rows.map((row, index) => (
                                <ListingMobileCard
                                    key={row.id}
                                    index={index + 1}
                                    title={
                                        <PartyLink partyId={row.party_id} name={row.party?.name} />
                                    }
                                    subtitle={formatAppDateTime(row.payment_date)}
                                    metric={{
                                        label: 'Amount',
                                        value: `₹ ${formatMoney(row.amount)}`,
                                    }}
                                    fields={[
                                        {
                                            label: 'Bill No.',
                                            value: row.freight_invoice ? (
                                                <Link
                                                    href={route(
                                                        'invoices.show',
                                                        row.freight_invoice_id!,
                                                    )}
                                                    className="text-indigo-600 hover:underline"
                                                >
                                                    {row.freight_invoice.bill_number}
                                                </Link>
                                            ) : (
                                                'Party account'
                                            ),
                                            fullWidth: true,
                                        },
                                        {
                                            label: 'Mode',
                                            value: row.payment_mode ?? '—',
                                        },
                                    ]}
                                    actions={
                                        <ListingMobileAction
                                            href={route('invoice-payments.edit', row.id)}
                                            variant="primary"
                                        >
                                            Edit
                                        </ListingMobileAction>
                                    }
                                />
                            ))}
                            thead={
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Party</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Bill No.</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">Amount</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Mode</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Reference</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Created</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                                </tr>
                            }
                            tbody={rows.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">{formatAppDateTime(row.payment_date)}</td>
                                    <td className="px-4 py-3 font-medium">
                                        <PartyLink partyId={row.party_id} name={row.party?.name} />
                                    </td>
                                    <td className="px-4 py-3">
                                        {row.freight_invoice ? (
                                            <Link
                                                href={route('invoices.show', row.freight_invoice_id!)}
                                                className="text-indigo-600 hover:underline"
                                            >
                                                {row.freight_invoice.bill_number}
                                            </Link>
                                        ) : (
                                            <span className="text-gray-500">Party account</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium">
                                        ₹ {formatMoney(row.amount)}
                                    </td>
                                    <td className="px-4 py-3 capitalize">{row.payment_mode ?? '—'}</td>
                                    <td className="px-4 py-3">{row.reference_no ?? '—'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                        {formatAppCreatedAt(row.created_at)}
                                    </td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                        <Link
                                            href={route('invoice-payments.edit', row.id)}
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
