import ListingMobileAction from '@/Components/ListingMobileAction';
import ListingMobileCard from '@/Components/ListingMobileCard';
import ListingTableShell from '@/Components/ListingTableShell';
import PageContainer from '@/Components/PageContainer';
import { DetailPageHeader } from '@/Components/ListPageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import InvoicePaymentStatusBadge, {
    invoicePaymentStatusFromAmounts,
} from '@/Components/InvoicePaymentStatusBadge';
import RecordPaymentForm, { type LockedPaymentInvoice } from '@/Components/RecordPaymentForm';
import TaxInvoiceDocument from '@/invoices/TaxInvoiceDocument';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { useAppQuery } from '@/hooks/useAppQuery';
import { usePageHeader } from '@/hooks/usePageHeader';
import { formatAppDateTime } from '@/lib/dateUtils';
import { downloadInvoicePdf } from '@/lib/invoicePdf';
import { formatMoney } from '@/lib/freightCalculator';
import type {
    FreightInvoice,
    InvoicePayment,
    InvoicePaymentSummary,
} from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

type InvoiceShowData = {
    invoice: FreightInvoice;
    paymentSummary: InvoicePaymentSummary;
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
    const payments = invoice?.payments ?? [];

const headerBtnClass =
    'whitespace-nowrap !px-2 !py-1.5 text-xs normal-case tracking-normal sm:!px-4 sm:!py-2 sm:uppercase sm:tracking-widest';

    const handlePrint = () => {
        window.print();
    };

    usePageHeader(
        <DetailPageHeader
            title={`Invoice ${invoice?.bill_number ?? ''}`}
            actions={
                invoice ? (
                    <>
                        {paymentSummary && paymentSummary.outstanding > 0 && (
                            <PrimaryButton
                                type="button"
                                className={headerBtnClass}
                                onClick={() => setPaymentOpen(true)}
                            >
                                <span className="sm:hidden">Record</span>
                                <span className="hidden sm:inline">Record Payment</span>
                            </PrimaryButton>
                        )}
                        <SecondaryButton
                            type="button"
                            className={headerBtnClass}
                            onClick={() => void downloadInvoicePdf(invoice.id, invoice.bill_number)}
                        >
                            <span className="sm:hidden">PDF</span>
                            <span className="hidden sm:inline">Download PDF</span>
                        </SecondaryButton>
                        <SecondaryButton
                            type="button"
                            className={`${headerBtnClass} no-print`}
                            onClick={handlePrint}
                        >
                            <span className="sm:hidden">Print</span>
                            <span className="hidden sm:inline">Print</span>
                        </SecondaryButton>
                        <Link href={route('invoices.edit', invoice.id)} className="shrink-0">
                            <SecondaryButton className={headerBtnClass}>Edit</SecondaryButton>
                        </Link>
                    </>
                ) : undefined
            }
        />,
        [invoice?.id, invoice?.bill_number, paymentSummary?.outstanding],
    );

    return (
        <>
            <Head title={`Invoice ${invoice?.bill_number ?? ''}`} />
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .invoice-show-page {
                        padding: 0 !important;
                        background: white !important;
                        max-width: none !important;
                    }
                    .tax-invoice-document {
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        padding: 0 !important;
                    }
                    .tax-invoice-lines-scroll {
                        overflow: visible !important;
                    }
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
                        <div className="no-print grid gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-sm sm:flex sm:flex-wrap sm:items-center sm:gap-3">
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
                                    <span className="hidden text-gray-400 sm:inline">|</span>
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

                        <TaxInvoiceDocument invoice={invoice} />

                        {payments.length > 0 && (
                            <div className="no-print space-y-3">
                                <h3 className="px-1 text-base font-semibold text-gray-800 sm:px-0">
                                    Party Payments (allocated to this bill)
                                </h3>
                                <ListingTableShell
                                className="no-print overflow-hidden rounded-lg bg-white shadow"
                                isEmpty={false}
                                mobileCountLabel={`${payments.length} payment${payments.length === 1 ? '' : 's'}`}
                                emptyMessage=""
                                mobile={payments.map((payment: InvoicePayment, index) => (
                                    <ListingMobileCard
                                        key={payment.id}
                                        index={index + 1}
                                        title={formatAppDateTime(payment.payment_date)}
                                        metric={{
                                            label: 'Amount',
                                            value: `₹ ${formatMoney(payment.amount)}`,
                                        }}
                                        fields={[
                                            {
                                                label: 'Mode',
                                                value: payment.payment_mode ?? '—',
                                            },
                                            {
                                                label: 'Reference',
                                                value: payment.reference_no ?? '—',
                                                fullWidth: true,
                                            },
                                        ]}
                                        actions={
                                            <ListingMobileAction
                                                href={route('invoice-payments.edit', payment.id)}
                                                variant="primary"
                                            >
                                                Edit
                                            </ListingMobileAction>
                                        }
                                    />
                                ))}
                                thead={
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
                                }
                                tbody={payments.map((payment: InvoicePayment) => (
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
                            />
                            </div>
                        )}
                    </>
                ) : null}
            </PageContainer>

            <Modal show={paymentOpen} onClose={() => setPaymentOpen(false)} maxWidth="2xl">
                <div className="p-4 sm:p-6">
                    <h3 className="text-lg font-semibold text-gray-900">Record Payment</h3>
                    {invoice && (
                        <div className="mt-4">
                            <RecordPaymentForm
                                key={invoice.id}
                                invoiceId={invoice.id}
                                lockedInvoice={
                                    paymentSummary
                                        ? ({
                                              id: invoice.id,
                                              bill_number: invoice.bill_number,
                                              party_id: invoice.party_id,
                                              balance_amount: invoice.balance_amount,
                                              received: paymentSummary.received,
                                              outstanding: paymentSummary.outstanding,
                                          } satisfies LockedPaymentInvoice)
                                        : undefined
                                }
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
