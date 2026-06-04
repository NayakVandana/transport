import PageContainer from '@/Components/PageContainer';
import ListExportButtons from '@/Components/ListExportButtons';
import ListFilterBar from '@/Components/ListFilterBar';
import ListingMobileAction from '@/Components/ListingMobileAction';
import ListingMobileCard from '@/Components/ListingMobileCard';
import ListingTableShell from '@/Components/ListingTableShell';
import Modal from '@/Components/Modal';
import ListPageHeader from '@/Components/ListPageHeader';
import InvoicePaymentStatusBadge, {
    invoicePaymentStatusFromAmounts,
} from '@/Components/InvoicePaymentStatusBadge';
import PartyLink from '@/Components/PartyLink';
import RecordPaymentForm, { type LockedPaymentInvoice } from '@/Components/RecordPaymentForm';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { defaultDateFilters, useFilteredList } from '@/hooks/useFilteredList';
import { usePageHeader } from '@/hooks/usePageHeader';
import { exportFilteredList } from '@/lib/listExport';
import { buildListFilterParams, type ListFilters } from '@/lib/listFilters';
import { formatAppCreatedAt, formatAppDateTime } from '@/lib/dateUtils';
import { downloadInvoicePdf } from '@/lib/invoicePdf';
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

function formatEntryNumbers(entryNumbers?: string[]): string {
    if (!entryNumbers?.length) {
        return '—';
    }

    return entryNumbers.join(', ');
}

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
    const [paymentInvoice, setPaymentInvoice] = useState<
        (FreightInvoice & { party?: { name: string } }) | null
    >(null);

    usePageHeader(
        <ListPageHeader
            title="Tax Invoices"
            create={{
                href: route('invoices.create'),
                label: 'New Invoice',
                mobileLabel: 'New',
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
        setPaymentInvoice(inv);
    };

    const closePaymentModal = () => {
        setPaymentInvoice(null);
    };

    const onPaymentSaved = async () => {
        closePaymentModal();
        await fetchList();
    };

    return (
        <>
            <Head title="Invoices" />

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
                        <ListingTableShell
                            isEmpty={invoices.length === 0}
                            mobileCountLabel={`${invoices.length} invoice${invoices.length === 1 ? '' : 's'}`}
                            emptyMessage={
                                hasActiveFilters
                                    ? 'No invoices match your filters.'
                                    : 'No invoices yet.'
                            }
                            mobile={invoices.map((inv, index) => (
                                <ListingMobileCard
                                    key={inv.id}
                                    index={index + 1}
                                    title={inv.bill_number}
                                    subtitle={<PartyLink partyId={inv.party_id} name={inv.party?.name} />}
                                    headerRight={
                                        <InvoicePaymentStatusBadge
                                            status={
                                                inv.payment_status ??
                                                invoicePaymentStatusFromAmounts(
                                                    inv.received ?? 0,
                                                    inv.outstanding ?? inv.balance_amount,
                                                )
                                            }
                                        />
                                    }
                                    metric={{
                                        label: 'Outstanding',
                                        value: `₹ ${formatMoney(inv.outstanding ?? inv.balance_amount)}`,
                                    }}
                                    fields={[
                                        {
                                            label: 'Entry Nos',
                                            value: formatEntryNumbers(inv.entry_numbers),
                                        },
                                        {
                                            label: 'Date',
                                            value: formatAppDateTime(inv.invoice_date),
                                        },
                                        {
                                            label: 'Balance Due',
                                            value: `₹ ${formatMoney(inv.balance_amount)}`,
                                        },
                                        {
                                            label: 'Received',
                                            value: `₹ ${formatMoney(inv.received ?? 0)}`,
                                        },
                                    ]}
                                    actions={
                                        <>
                                            <ListingMobileAction
                                                href={route('invoices.show', inv.id)}
                                                variant="primary"
                                            >
                                                View
                                            </ListingMobileAction>
                                            <ListingMobileAction
                                                onClick={() =>
                                                    void downloadInvoicePdf(inv.id, inv.bill_number)
                                                }
                                            >
                                                PDF
                                            </ListingMobileAction>
                                            {Number(inv.outstanding ?? inv.balance_amount) > 0 && (
                                                <ListingMobileAction
                                                    onClick={() => openPaymentModal(inv)}
                                                    variant="success"
                                                >
                                                    Record Payment
                                                </ListingMobileAction>
                                            )}
                                        </>
                                    }
                                />
                            ))}
                            thead={
                                <tr>
                                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-left font-medium text-gray-500">Bill No</th>
                                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-left font-medium text-gray-500">Party</th>
                                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-left font-medium text-gray-500">Entry Nos</th>
                                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-left font-medium text-gray-500">Date</th>
                                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-left font-medium text-gray-500">Payment</th>
                                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-right font-medium text-gray-500">Balance Due</th>
                                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-right font-medium text-gray-500">Received</th>
                                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-right font-medium text-gray-500">Outstanding</th>
                                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-left font-medium text-gray-500">Created</th>
                                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-right font-medium text-gray-500">Actions</th>
                                </tr>
                            }
                            tbody={invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 sm:px-6 sm:py-3 font-medium">
                                        <Link
                                            href={route('invoices.show', inv.id)}
                                            className="text-indigo-600 hover:underline"
                                        >
                                            {inv.bill_number}
                                        </Link>
                                    </td>
                                    <td className="px-3 py-2 sm:px-6 sm:py-3">
                                        <PartyLink partyId={inv.party_id} name={inv.party?.name} />
                                    </td>
                                    <td className="px-3 py-2 sm:px-6 sm:py-3 font-mono text-sm text-gray-700">
                                        {formatEntryNumbers(inv.entry_numbers)}
                                    </td>
                                    <td className="px-3 py-2 sm:px-6 sm:py-3">{formatAppDateTime(inv.invoice_date)}</td>
                                    <td className="px-3 py-2 sm:px-6 sm:py-3">
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
                                    <td className="px-3 py-2 sm:px-6 sm:py-3 text-right">
                                        ₹ {formatMoney(inv.balance_amount)}
                                    </td>
                                    <td className="px-3 py-2 sm:px-6 sm:py-3 text-right text-green-700">
                                        ₹ {formatMoney(inv.received ?? 0)}
                                    </td>
                                    <td className="px-3 py-2 sm:px-6 sm:py-3 text-right font-medium text-indigo-700">
                                        ₹ {formatMoney(inv.outstanding ?? inv.balance_amount)}
                                    </td>
                                    <td className="px-3 py-2 sm:px-6 sm:py-3 whitespace-nowrap text-gray-600">
                                        {formatAppCreatedAt(inv.created_at)}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 sm:px-6 sm:py-3 text-right">
                                        <Link
                                            href={route('invoices.show', inv.id)}
                                            className="text-indigo-600 hover:underline"
                                        >
                                            View
                                        </Link>
                                        <span className="mx-2 text-gray-300">|</span>
                                        <button
                                            type="button"
                                            className="text-gray-600 hover:underline"
                                            onClick={() =>
                                                void downloadInvoicePdf(inv.id, inv.bill_number)
                                            }
                                        >
                                            PDF
                                        </button>
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
                            ))}
                        />
                    )}
            </PageContainer>

            <Modal show={paymentInvoice !== null} onClose={closePaymentModal} maxWidth="2xl">
                <div className="p-4 sm:p-6">
                    <h3 className="text-lg font-semibold text-gray-900">Record Payment</h3>
                    {paymentInvoice && (
                        <div className="mt-4">
                            <RecordPaymentForm
                                key={paymentInvoice.id}
                                invoiceId={paymentInvoice.id}
                                lockedInvoice={
                                    paymentInvoice.received !== undefined &&
                                    paymentInvoice.outstanding !== undefined
                                        ? ({
                                              id: paymentInvoice.id,
                                              bill_number: paymentInvoice.bill_number,
                                              party_id: paymentInvoice.party_id,
                                              balance_amount: paymentInvoice.balance_amount,
                                              received: paymentInvoice.received,
                                              outstanding: paymentInvoice.outstanding,
                                          } satisfies LockedPaymentInvoice)
                                        : undefined
                                }
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
