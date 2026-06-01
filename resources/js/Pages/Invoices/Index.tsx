import ListExportButtons from '@/Components/ListExportButtons';
import ListFilterBar from '@/Components/ListFilterBar';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import InvoicePaymentStatusBadge, {
    invoicePaymentStatusFromAmounts,
} from '@/Components/InvoicePaymentStatusBadge';
import RecordPaymentForm from '@/Components/RecordPaymentForm';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { defaultDateFilters, useFilteredList } from '@/hooks/useFilteredList';
import { usePageHeader } from '@/hooks/usePageHeader';
import { exportFilteredList } from '@/lib/listExport';
import { buildListFilterParams, type ListFilters } from '@/lib/listFilters';
import { formatMoney } from '@/lib/freightCalculator';
import type { FreightInvoice, Party } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

type InvoiceFilters = ListFilters & {
    status?: string;
    payment_status?: string;
    party_id?: string;
};

type InvoicesListData = {
    invoices: { data: (FreightInvoice & { party?: { name: string } })[] };
    parties: Pick<Party, 'id' | 'name'>[];
    filters: InvoiceFilters;
    filterSummary: string;
};

const defaultFilters: InvoiceFilters = {
    search: '',
    status: '',
    payment_status: '',
    party_id: '',
    ...defaultDateFilters,
};

export default function InvoicesIndex() {
    const [actionError, setActionError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const [paymentPartyId, setPaymentPartyId] = useState<number | null>(null);

    usePageHeader(
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Tax Invoices</h2>
            <Link href={route('invoices.create')}>
                <PrimaryButton>New Invoice</PrimaryButton>
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
    } = useFilteredList<InvoicesListData, InvoiceFilters>({
        defaultFilters,
        extraFilterKeys: ['status', 'payment_status', 'party_id'],
        load: async (activeFilters) => {
            const res = await appApiPost<ApiEnvelope<InvoicesListData>>(
                '/invoices/invoices-list',
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

    const invoices = data?.invoices.data ?? [];
    const displayError = actionError ?? error;

    const exportFiltered = async (type: 'csv' | 'pdf') => {
        try {
            setActionError(null);
            await exportFilteredList('invoices', type, { ...filters, search: searchInput });
        } catch {
            setActionError(`Could not export ${type.toUpperCase()}.`);
        }
    };

    const openPaymentModal = (inv: FreightInvoice & { party?: { name: string } }) => {
        setPaymentPartyId(inv.party_id);
    };

    const closePaymentModal = () => {
        setPaymentPartyId(null);
    };

    const onPaymentSaved = async () => {
        closePaymentModal();
        await fetchList();
    };

    return (
        <>
            <Head title="Invoices" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-4 sm:px-6 lg:px-8">
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
                            placeholder: 'Search bill number…',
                            onChange: setSearchInput,
                            onSubmit: () => applySearch(searchInput),
                        }}
                        selects={[
                            {
                                name: 'status',
                                label: 'Invoice Status',
                                value: filters.status ?? '',
                                options: [
                                    { value: 'draft', label: 'Draft' },
                                    { value: 'finalized', label: 'Finalized' },
                                ],
                                onChange: (value) => updateField('status', value),
                            },
                            {
                                name: 'payment_status',
                                label: 'Payment Status',
                                value: filters.payment_status ?? '',
                                options: [
                                    { value: 'paid', label: 'Paid' },
                                    { value: 'partial', label: 'Partial' },
                                    { value: 'pending', label: 'Pending' },
                                ],
                                onChange: (value) => updateField('payment_status', value),
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
                        <p className="text-center text-sm text-gray-500">Loading invoices…</p>
                    ) : (
                        <div className="overflow-hidden rounded-lg bg-white shadow">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-medium text-gray-500">Bill No</th>
                                        <th className="px-6 py-3 text-left font-medium text-gray-500">Party</th>
                                        <th className="px-6 py-3 text-left font-medium text-gray-500">Date</th>
                                        <th className="px-6 py-3 text-left font-medium text-gray-500">Payment</th>
                                        <th className="px-6 py-3 text-right font-medium text-gray-500">Balance Due</th>
                                        <th className="px-6 py-3 text-right font-medium text-gray-500">Received</th>
                                        <th className="px-6 py-3 text-right font-medium text-gray-500">Outstanding</th>
                                        <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {invoices.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                                {hasActiveFilters
                                                    ? 'No invoices match your filters.'
                                                    : 'No invoices yet.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        invoices.map((inv) => (
                                            <tr key={inv.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-3 font-medium">
                                                    <Link
                                                        href={route('invoices.show', inv.id)}
                                                        className="text-indigo-600 hover:underline"
                                                    >
                                                        {inv.bill_number}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-3">{inv.party?.name}</td>
                                                <td className="px-6 py-3">{inv.invoice_date}</td>
                                                <td className="px-6 py-3">
                                                    <InvoicePaymentStatusBadge
                                                        status={
                                                            inv.payment_status ??
                                                            invoicePaymentStatusFromAmounts(
                                                                inv.received ?? 0,
                                                                inv.outstanding ?? inv.balance_amount,
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    ₹ {formatMoney(inv.balance_amount)}
                                                </td>
                                                <td className="px-6 py-3 text-right text-green-700">
                                                    ₹ {formatMoney(inv.received ?? 0)}
                                                </td>
                                                <td className="px-6 py-3 text-right font-medium text-indigo-700">
                                                    ₹ {formatMoney(inv.outstanding ?? inv.balance_amount)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-3 text-right">
                                                    <Link
                                                        href={route('invoices.show', inv.id)}
                                                        className="text-indigo-600 hover:underline"
                                                    >
                                                        View
                                                    </Link>
                                                    <span className="mx-2 text-gray-300">|</span>
                                                    <Link
                                                        href={route('invoices.print', inv.id)}
                                                        className="text-gray-600 hover:underline"
                                                        target="_blank"
                                                    >
                                                        Print
                                                    </Link>
                                                    {Number(inv.outstanding ?? inv.balance_amount) > 0 && (
                                                        <>
                                                            <span className="mx-2 text-gray-300">|</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => openPaymentModal(inv)}
                                                                className="text-green-700 hover:underline"
                                                            >
                                                                Record Payment
                                                            </button>
                                                        </>
                                                    )}
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

            <Modal show={paymentPartyId !== null} onClose={closePaymentModal} maxWidth="2xl">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900">Record Payment</h3>
                    {paymentPartyId && (
                        <div className="mt-4">
                            <RecordPaymentForm
                                key={paymentPartyId}
                                partyId={paymentPartyId}
                                onSuccess={() => void onPaymentSaved()}
                                onCancel={closePaymentModal}
                            />
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
}
