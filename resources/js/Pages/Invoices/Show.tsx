import PageContainer from '@/Components/PageContainer';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import InvoicePaymentStatusBadge, {
    invoicePaymentStatusFromAmounts,
} from '@/Components/InvoicePaymentStatusBadge';
import RecordPaymentForm from '@/Components/RecordPaymentForm';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { invalidateAppQuery, useAppQuery } from '@/hooks/useAppQuery';
import { usePageHeader } from '@/hooks/usePageHeader';
import { formatAppDateTime } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/freightCalculator';
import type {
    FreightInvoice,
    InvoicePayment,
    InvoicePaymentSummary,
    PartyPaymentSummary,
} from '@/types/transport';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

type InvoiceShowData = {
    invoice: FreightInvoice;
    paymentSummary: InvoicePaymentSummary;
    partySummary: PartyPaymentSummary;
};

export default function InvoiceShow({ invoiceId }: { invoiceId: number }) {
    const [paymentOpen, setPaymentOpen] = useState(false);

    const { data, loading, error, refresh } = useAppQuery(`invoice-show:${invoiceId}`, async () => {
        const res = await appApiPost<ApiEnvelope<InvoiceShowData>>('/invoices/invoice-show', {
            id: invoiceId,
        });

        if (!res.success || !res.data?.invoice) {
            throw new Error(res.message || 'Could not load invoice.');
        }

        return res.data;
    });

    const invoice = data?.invoice;
    const paymentSummary = data?.paymentSummary;
    const partySummary = data?.partySummary;
    const payments = invoice?.payments ?? [];

    const destroy = async (id: number) => {
        if (!confirm('Delete this invoice?')) {
            return;
        }

        const res = await appApiPost<ApiEnvelope<null>>('/invoices/invoice-destroy', { id });

        if (!res.success) {
            return;
        }

        invalidateAppQuery('invoices-list');
        router.visit(route('invoices.index'));
    };

    usePageHeader(
        <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold text-gray-800">
                Invoice {invoice?.bill_number ?? ''}
            </h2>
            {invoice && (
                <div className="flex flex-wrap gap-2">
                    {partySummary && partySummary.outstanding > 0 && (
                        <PrimaryButton type="button" onClick={() => setPaymentOpen(true)}>
                            Record Payment
                        </PrimaryButton>
                    )}
                    <Link href={route('invoices.print', invoice.id)} target="_blank">
                        <SecondaryButton>Print</SecondaryButton>
                    </Link>
                    <Link href={route('invoices.edit', invoice.id)}>
                        <SecondaryButton>Edit</SecondaryButton>
                    </Link>
                    <SecondaryButton onClick={() => void destroy(invoice.id)}>
                        Delete
                    </SecondaryButton>
                </div>
            )}
        </div>,
        [invoice?.id, invoice?.bill_number, partySummary?.outstanding],
    );

    return (
        <>
            <Head title={`Invoice ${invoice?.bill_number ?? ''}`} />

            <PageContainer className="space-y-6">
                    {loading && !invoice ? (
                        <p className="text-center text-sm text-gray-500">Loading invoice…</p>
                    ) : error ? (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {error}
                        </p>
                    ) : invoice ? (
                        <>
                            <div className="rounded-lg bg-white p-6 shadow">
                                <div className="mb-4 flex flex-wrap items-center gap-3">
                                    {paymentSummary && (
                                        <InvoicePaymentStatusBadge
                                            status={
                                                paymentSummary.payment_status ??
                                                invoice.payment_status ??
                                                invoicePaymentStatusFromAmounts(
                                                    paymentSummary.received,
                                                    paymentSummary.outstanding,
                                                )
                                            }
                                        />
                                    )}
                                    <span className="text-xs capitalize text-gray-500">
                                        Invoice: {invoice.status}
                                    </span>
                                </div>
                                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                                    <div>
                                        <dt className="text-gray-500">Party</dt>
                                        <dd className="font-medium">{invoice.party?.name}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Date</dt>
                                        <dd>{formatAppDateTime(invoice.invoice_date)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Net Value</dt>
                                        <dd>₹ {formatMoney(invoice.net_value)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Balance Due</dt>
                                        <dd>₹ {formatMoney(invoice.balance_amount)}</dd>
                                    </div>
                                    {paymentSummary && (
                                        <>
                                            <div>
                                                <dt className="text-gray-500">Received (this bill)</dt>
                                                <dd className="font-medium text-green-700">
                                                    ₹ {formatMoney(paymentSummary.received)}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-gray-500">Outstanding (this bill)</dt>
                                                <dd className="font-semibold text-indigo-700">
                                                    ₹ {formatMoney(paymentSummary.outstanding)}
                                                </dd>
                                            </div>
                                        </>
                                    )}
                                    {partySummary && (
                                        <>
                                            <div>
                                                <dt className="text-gray-500">Party received</dt>
                                                <dd className="font-medium text-green-700">
                                                    ₹ {formatMoney(partySummary.received)}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-gray-500">Party outstanding</dt>
                                                <dd className="font-semibold text-indigo-700">
                                                    ₹ {formatMoney(partySummary.outstanding)}
                                                </dd>
                                            </div>
                                        </>
                                    )}
                                </dl>
                                <p className="mt-4 text-xs text-gray-600">{invoice.balance_in_words}</p>
                            </div>

                            {payments.length > 0 && (
                                <div className="overflow-hidden rounded-lg bg-white shadow">
                                    <div className="border-b px-6 py-4">
                                        <h3 className="font-semibold text-gray-800">
                                            Party Payments (allocated to this bill)
                                        </h3>
                                    </div>
                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left font-medium text-gray-500">
                                                    Date
                                                </th>
                                                <th className="px-6 py-3 text-right font-medium text-gray-500">
                                                    Amount
                                                </th>
                                                <th className="px-6 py-3 text-left font-medium text-gray-500">
                                                    Mode
                                                </th>
                                                <th className="px-6 py-3 text-left font-medium text-gray-500">
                                                    Reference
                                                </th>
                                                <th className="px-6 py-3 text-right font-medium text-gray-500">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {payments.map((payment: InvoicePayment) => (
                                                <tr key={payment.id}>
                                                    <td className="px-6 py-3">{formatAppDateTime(payment.payment_date)}</td>
                                                    <td className="px-6 py-3 text-right font-medium">
                                                        ₹ {formatMoney(payment.amount)}
                                                    </td>
                                                    <td className="px-6 py-3 capitalize">
                                                        {payment.payment_mode ?? '—'}
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        {payment.reference_no ?? '—'}
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <Link
                                                            href={route(
                                                                'invoice-payments.edit',
                                                                payment.id,
                                                            )}
                                                            className="text-indigo-600 hover:underline"
                                                        >
                                                            Edit
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    ) : null}
            </PageContainer>

            <Modal show={paymentOpen} onClose={() => setPaymentOpen(false)} maxWidth="2xl">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900">Record Payment</h3>
                    {invoice && (
                        <div className="mt-4">
                            <RecordPaymentForm
                                key={invoice.party_id}
                                partyId={invoice.party_id}
                                onSuccess={() => {
                                    setPaymentOpen(false);
                                    void refresh();
                                }}
                                onCancel={() => setPaymentOpen(false)}
                            />
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
}
