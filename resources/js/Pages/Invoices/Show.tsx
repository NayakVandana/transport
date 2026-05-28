import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatMoney } from '@/lib/freightCalculator';
import type { FreightInvoice } from '@/types/transport';
import { Head, Link, router } from '@inertiajs/react';

export default function InvoiceShow({ invoice }: { invoice: FreightInvoice }) {
    const destroy = () => {
        if (confirm('Delete this invoice?')) {
            router.delete(route('invoices.destroy', invoice.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Invoice {invoice.bill_number}
                    </h2>
                    <div className="flex gap-2">
                        <Link href={route('invoices.print', invoice.id)} target="_blank">
                            <PrimaryButton>Print</PrimaryButton>
                        </Link>
                        <Link href={route('invoices.edit', invoice.id)}>
                            <SecondaryButton>Edit</SecondaryButton>
                        </Link>
                        <SecondaryButton onClick={destroy}>Delete</SecondaryButton>
                    </div>
                </div>
            }
        >
            <Head title={`Invoice ${invoice.bill_number}`} />

            <div className="py-8">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="rounded-lg bg-white p-6 shadow">
                        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
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
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
