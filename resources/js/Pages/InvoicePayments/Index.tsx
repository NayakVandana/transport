import ListExportButtons from '@/Components/ListExportButtons';
import ListFilterBar from '@/Components/ListFilterBar';
import PrimaryButton from '@/Components/PrimaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { defaultDateFilters, useFilteredList } from '@/hooks/useFilteredList';
import { usePageHeader } from '@/hooks/usePageHeader';
import { exportFilteredList } from '@/lib/listExport';
import { buildListFilterParams, type ListFilters } from '@/lib/listFilters';
import { formatMoney } from '@/lib/freightCalculator';
import type {
    InvoicePayment,
    InvoicePaymentTotals,
    Party,
    PartyOutstanding,
} from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

type InvoicePaymentFilters = ListFilters & {
    party_id?: string;
};

type InvoicePaymentsListData = {
    invoicePayments: { data: InvoicePayment[] };
    parties: Pick<Party, 'id' | 'name'>[];
    partyOutstanding: PartyOutstanding[];
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
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Received Payments</h2>
            <Link href={route('invoice-payments.create')}>
                <PrimaryButton>Record Payment</PrimaryButton>
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
    const partyOutstanding = data?.partyOutstanding ?? [];
    const totalOutstanding = data?.totalOutstanding ?? 0;

    const destroy = async (id: number) => {
        if (!confirm('Remove this payment record?')) {
            return;
        }

        const res = await appApiPost<ApiEnvelope<null>>('/invoice-payments/invoice-payment-destroy', {
            id,
        });

        if (!res.success) {
            setActionError(res.message || 'Could not remove payment.');
            return;
        }

        await fetchList();
    };

    const displayError = actionError ?? error;

    const exportFiltered = async (type: 'csv' | 'pdf') => {
        try {
            setActionError(null);
            await exportFilteredList('invoice-payments', type, { ...filters, search: searchInput });
        } catch {
            setActionError(`Could not export ${type.toUpperCase()}.`);
        }
    };

    const filterByParty = (partyId: number) => {
        setSearchInput('');
        updateField('party_id', String(partyId));
    };

    return (
        <>
            <Head title="Received Payments" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-4 sm:px-6 lg:px-8">
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

                    {partyOutstanding.length > 0 && (
                        <div className="overflow-x-auto rounded-lg bg-white shadow">
                            <div className="border-b px-4 py-3">
                                <h3 className="font-semibold text-gray-800">Party-wise Outstanding</h3>
                            </div>
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Party</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Invoices</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Balance Due</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Received</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Outstanding</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {partyOutstanding.map((row) => (
                                        <tr key={row.party_id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium">{row.party_name}</td>
                                            <td className="px-4 py-3 text-right">{row.invoice_count}</td>
                                            <td className="px-4 py-3 text-right">
                                                ₹ {formatMoney(row.balance_due)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-green-700">
                                                ₹ {formatMoney(row.received)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-indigo-700">
                                                ₹ {formatMoney(row.outstanding)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => filterByParty(row.party_id)}
                                                    className="text-indigo-600 hover:underline"
                                                >
                                                    View payments
                                                </button>
                                                <span className="mx-2 text-gray-300">|</span>
                                                <Link
                                                    href={route('parties.payments', row.party_id)}
                                                    className="text-indigo-600 hover:underline"
                                                >
                                                    Manage
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

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
                        <div className="overflow-x-auto rounded-lg bg-white shadow">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Bill No.</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Party</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Amount</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Mode</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Reference</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                                {hasActiveFilters
                                                    ? 'No payments match your filters.'
                                                    : 'No payments recorded yet.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((row) => (
                                            <tr key={row.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">{row.payment_date}</td>
                                                <td className="px-4 py-3">
                                                    {row.freight_invoice ? (
                                                        <Link
                                                            href={route(
                                                                'invoices.show',
                                                                row.freight_invoice_id,
                                                            )}
                                                            className="text-indigo-600 hover:underline"
                                                        >
                                                            {row.freight_invoice.bill_number}
                                                        </Link>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">{row.party?.name ?? '—'}</td>
                                                <td className="px-4 py-3 text-right font-medium">
                                                    ₹ {formatMoney(row.amount)}
                                                </td>
                                                <td className="px-4 py-3 capitalize">
                                                    {row.payment_mode ?? '—'}
                                                </td>
                                                <td className="px-4 py-3">{row.reference_no ?? '—'}</td>
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    <Link
                                                        href={route('invoice-payments.edit', row.id)}
                                                        className="text-indigo-600 hover:underline"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <span className="mx-2 text-gray-300">|</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => void destroy(row.id)}
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
                </div>
            </div>
        </>
    );
}
