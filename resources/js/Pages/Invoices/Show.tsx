import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { invalidateAppQuery, useAppQuery } from '@/hooks/useAppQuery';
import { usePageHeader } from '@/hooks/usePageHeader';
import { formatMoney } from '@/lib/freightCalculator';
import type { FreightInvoice } from '@/types/transport';
import { Head, Link, router } from '@inertiajs/react';

export default function InvoiceShow({ invoiceId }: { invoiceId: number }) {
    const { data: invoice, loading, error } = useAppQuery(
        `invoice-show:${invoiceId}`,
        async () => {
            const res = await appApiPost<ApiEnvelope<{ invoice: FreightInvoice }>>(
                '/invoices/invoice-show',
                { id: invoiceId },
            );

            if (!res.success || !res.data?.invoice) {
                throw new Error(res.message || 'Could not load invoice.');
            }

            return res.data.invoice;
        },
    );

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
                <div className="flex gap-2">
                    <Link href={route('invoices.print', invoice.id)} target="_blank">
                        <PrimaryButton>Print</PrimaryButton>
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
        [invoice?.id, invoice?.bill_number],
    );

    return (
        <>
            <Head title={`Invoice ${invoice?.bill_number ?? ''}`} />

            <div className="py-8">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    {loading && !invoice ? (
                        <p className="text-center text-sm text-gray-500">Loading invoice…</p>
                    ) : error ? (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {error}
                        </p>
                    ) : invoice ? (
                        <div className="rounded-lg bg-white p-6 shadow">
                            <dl className="grid gap-4 text-sm sm:grid-cols-2">
                                <div>
                                    <dt className="text-gray-500">Party</dt>
                                    <dd className="font-medium">{invoice.party?.name}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Date</dt>
                                    <dd>{invoice.invoice_date}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Net Value</dt>
                                    <dd>₹ {formatMoney(invoice.net_value)}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Balance Due</dt>
                                    <dd className="text-lg font-semibold text-indigo-700">
                                        ₹ {formatMoney(invoice.balance_amount)}
                                    </dd>
                                </div>
                            </dl>
                            <p className="mt-4 text-xs text-gray-600">{invoice.balance_in_words}</p>
                        </div>
                    ) : null}
                </div>
            </div>
        </>
    );
}
