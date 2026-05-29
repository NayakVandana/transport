import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { formatMoney } from '@/lib/freightCalculator';
import type { FreightInvoice } from '@/types/transport';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function InvoiceShow({ invoiceId }: { invoiceId: number }) {
    const [invoice, setInvoice] = useState<FreightInvoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);

        void appApiPost<ApiEnvelope<{ invoice: FreightInvoice }>>('/invoices/invoice-show', {
            id: invoiceId,
        })
            .then((res) => {
                if (!res.success || !res.data?.invoice) {
                    setError(res.message || 'Could not load invoice.');
                    return;
                }

                setInvoice(res.data.invoice);
            })
            .catch(() => {
                setError('Could not load invoice.');
            })
            .finally(() => setLoading(false));
    }, [invoiceId]);

    const destroy = async () => {
        if (!confirm('Delete this invoice?')) {
            return;
        }

        const res = await appApiPost<ApiEnvelope<null>>('/invoices/invoice-destroy', {
            id: invoiceId,
        });

        if (!res.success) {
            setError(res.message || 'Could not delete invoice.');
            return;
        }

        router.visit(route('invoices.index'));
    };

    return (
        <AuthenticatedLayout
            header={
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
                            <SecondaryButton onClick={() => void destroy()}>Delete</SecondaryButton>
                        </div>
                    )}
                </div>
            }
        >
            <Head title={`Invoice ${invoice?.bill_number ?? ''}`} />

            <div className="py-8">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    {loading ? (
                        <p className="text-center text-sm text-gray-500">Loading invoice…</p>
                    ) : error ? (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {error}
                        </p>
                    ) : invoice ? (
                        <div className="rounded-lg bg-white p-6 shadow">
                            <dl className="grid gap-4 text-sm sm:grid-cols-2">
                                <div>
                                    <dt className="text-gray-500">Customer</dt>
                                    <dd className="font-medium">{invoice.customer?.name}</dd>
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
        </AuthenticatedLayout>
    );
}
