import PrimaryButton from '@/Components/PrimaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { useAppQuery } from '@/hooks/useAppQuery';
import { usePageHeader } from '@/hooks/usePageHeader';
import { formatMoney } from '@/lib/freightCalculator';
import type { FreightInvoice } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';

export default function InvoicesIndex() {
    usePageHeader(
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Tax Invoices</h2>
            <Link href={route('invoices.create')}>
                <PrimaryButton>New Invoice</PrimaryButton>
            </Link>
        </div>,
    );

    const { data: invoices, loading, error } = useAppQuery(
        'invoices-list',
        async () => {
            const res = await appApiPost<
                ApiEnvelope<{
                    invoices: { data: (FreightInvoice & { customer?: { name: string } })[] };
                }>
            >('/invoices/invoices-list', {});

            if (!res.success || !res.data?.invoices) {
                throw new Error(res.message || 'Could not load invoices.');
            }

            return res.data.invoices.data;
        },
    );

    return (
        <>
            <Head title="Invoices" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {error && (
                        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {error}
                        </p>
                    )}

                    {loading && !invoices ? (
                        <p className="text-center text-sm text-gray-500">Loading invoices…</p>
                    ) : (
                        <div className="overflow-hidden rounded-lg bg-white shadow">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-medium text-gray-500">Bill No</th>
                                        <th className="px-6 py-3 text-left font-medium text-gray-500">Customer</th>
                                        <th className="px-6 py-3 text-left font-medium text-gray-500">Date</th>
                                        <th className="px-6 py-3 text-right font-medium text-gray-500">Balance</th>
                                        <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {(invoices ?? []).length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                No invoices yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        (invoices ?? []).map((inv) => (
                                            <tr key={inv.id}>
                                                <td className="px-6 py-3 font-medium">{inv.bill_number}</td>
                                                <td className="px-6 py-3">{inv.customer?.name}</td>
                                                <td className="px-6 py-3">{inv.invoice_date}</td>
                                                <td className="px-6 py-3 text-right">
                                                    ₹ {formatMoney(inv.balance_amount)}
                                                </td>
                                                <td className="space-x-2 px-6 py-3 text-right">
                                                    <Link
                                                        href={route('invoices.show', inv.id)}
                                                        className="text-indigo-600 hover:underline"
                                                    >
                                                        View
                                                    </Link>
                                                    <Link
                                                        href={route('invoices.print', inv.id)}
                                                        className="text-gray-600 hover:underline"
                                                        target="_blank"
                                                    >
                                                        Print
                                                    </Link>
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
