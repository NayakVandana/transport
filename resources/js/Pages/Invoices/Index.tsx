import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatMoney } from '@/lib/freightCalculator';
import type { FreightInvoice } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';

interface Paginated {
    data: (FreightInvoice & { customer?: { name: string } })[];
}

export default function InvoicesIndex({ invoices }: { invoices: Paginated }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">Tax Invoices</h2>
                    <Link href={route('invoices.create')}>
                        <PrimaryButton>New Invoice</PrimaryButton>
                    </Link>
                </div>
            }
        >
            <Head title="Invoices" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
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
                                {invoices.data.map((inv) => (
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
