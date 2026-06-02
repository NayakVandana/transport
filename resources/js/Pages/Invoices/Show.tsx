import PageContainer from '@/Components/PageContainer';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import InvoicePaymentStatusBadge, {
    invoicePaymentStatusFromAmounts,
} from '@/Components/InvoicePaymentStatusBadge';
import RecordPaymentForm from '@/Components/RecordPaymentForm';
import TaxInvoiceDocument from '@/invoices/TaxInvoiceDocument';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { useAppQuery } from '@/hooks/useAppQuery';
import { usePageHeader } from '@/hooks/usePageHeader';
import { formatAppDateTime } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/freightCalculator';
import type {
    FreightInvoice,
    InvoicePayment,
    InvoicePaymentSummary,
    PartyPaymentSummary,
} from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
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
                </div>
            )}
        </div>,
        [invoice?.id, invoice?.bill_number, partySummary?.outstanding],
    );

    return (
        <>
            <Head title={`Invoice ${invoice?.bill_number ?? ''}`} />
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .invoice-show-page { padding: 0 !important; background: white !important; }
                    .tax-invoice-document { box-shadow: none !important; }
                }
            `}</style>

            <PageContainer className="invoice-show-page space-y-6">
                {loading && !invoice ? (
                    <p className="text-center text-sm text-gray-500">Loading invoice…</p>
                ) : error ? (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {error}
                    </p>
                ) : invoice ? (
                    <>
                        <div className="no-print flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm">
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
                            <span className="text-gray-500 capitalize">Status: {invoice.status}</span>
                            {paymentSummary && (
                                <>
                                    <span className="text-gray-400">|</span>
                                    <span>
                                        Received:{' '}
                                        <strong className="text-green-700">
                                            ₹ {formatMoney(paymentSummary.received)}
                                        </strong>
                                    </span>
                                    <span>
                                        Outstanding:{' '}
                                        <strong className="text-indigo-700">
                                            ₹ {formatMoney(paymentSummary.outstanding)}
                                        </strong>
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <TaxInvoiceDocument invoice={invoice} />
                        </div>

                        {payments.length > 0 && (
                            <div className="no-print overflow-x-auto rounded-lg bg-white shadow">
                                <div className="border-b px-4 py-4 sm:px-6">
                                    <h3 className="font-semibold text-gray-800">
                                        Party Payments (allocated to this bill)
                                    </h3>
                                </div>
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium text-gray-500 sm:px-6 sm:py-3">
                                                Date
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium text-gray-500 sm:px-6 sm:py-3">
                                                Amount
                                            </th>
                                            <th className="px-3 py-2 text-left font-medium text-gray-500 sm:px-6 sm:py-3">
                                                Mode
                                            </th>
                                            <th className="px-3 py-2 text-left font-medium text-gray-500 sm:px-6 sm:py-3">
                                                Reference
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium text-gray-500 sm:px-6 sm:py-3">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {payments.map((payment: InvoicePayment) => (
                                            <tr key={payment.id}>
                                                <td className="px-3 py-2 sm:px-6 sm:py-3">
                                                    {formatAppDateTime(payment.payment_date)}
                                                </td>
                                                <td className="px-3 py-2 text-right font-medium sm:px-6 sm:py-3">
                                                    ₹ {formatMoney(payment.amount)}
                                                </td>
                                                <td className="px-3 py-2 capitalize sm:px-6 sm:py-3">
                                                    {payment.payment_mode ?? '—'}
                                                </td>
                                                <td className="px-3 py-2 sm:px-6 sm:py-3">
                                                    {payment.reference_no ?? '—'}
                                                </td>
                                                <td className="px-3 py-2 text-right sm:px-6 sm:py-3">
                                                    <Link
                                                        href={route('invoice-payments.edit', payment.id)}
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
