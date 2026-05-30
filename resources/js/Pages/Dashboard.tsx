import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { formatMoney } from '@/lib/freightCalculator';
import { useAppQuery } from '@/hooks/useAppQuery';
import { usePageHeader } from '@/hooks/usePageHeader';
import type { FreightInvoice } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';

type DashboardData = {
    stats: {
        parties: number;
        invoices: number;
        outstanding: number;
        has_company: boolean;
    };
    recentInvoices: (FreightInvoice & { party?: { name: string } })[];
};

export default function Dashboard() {
    usePageHeader(
        <h2 className="text-xl font-semibold leading-tight text-gray-800">
            Transport Dashboard
        </h2>,
    );

    const { data, loading, error } = useAppQuery('dashboard-summary', async () => {
        const res = await appApiPost<ApiEnvelope<DashboardData>>(
            '/dashboard/dashboard-summary',
            {},
        );

        if (!res.success || !res.data) {
            throw new Error(res.message || 'Could not load dashboard.');
        }

        return res.data;
    });

    return (
        <>
            <Head title="Dashboard" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {loading && !data ? (
                        <p className="text-center text-sm text-gray-500">Loading dashboard…</p>
                    ) : error ? (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {error}
                        </p>
                    ) : data ? (
                        <>
                            {!data.stats.has_company && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
                                    Set up your{' '}
                                    <Link
                                        href={route('company.edit')}
                                        className="font-semibold underline"
                                    >
                                        company profile
                                    </Link>{' '}
                                    before creating tax invoices.
                                </div>
                            )}

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <StatCard label="Party" value={String(data.stats.parties)} />
                                <StatCard label="Invoices" value={String(data.stats.invoices)} />
                                <StatCard
                                    label="Outstanding Balance"
                                    value={`₹ ${formatMoney(data.stats.outstanding)}`}
                                />
                                <div className="flex items-center rounded-lg bg-white p-5 shadow">
                                    <Link
                                        href={route('invoices.create')}
                                        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
                                    >
                                        New Tax Invoice
                                    </Link>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-lg bg-white shadow">
                                <div className="border-b px-6 py-4">
                                    <h3 className="font-semibold text-gray-800">Recent Invoices</h3>
                                </div>
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500">
                                                Bill No
                                            </th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500">
                                                Party
                                            </th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-right font-medium text-gray-500">
                                                Balance
                                            </th>
                                            <th className="px-6 py-3 text-right font-medium text-gray-500">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {data.recentInvoices.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                    No invoices yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            data.recentInvoices.map((inv) => (
                                                <tr key={inv.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-3">
                                                        <Link
                                                            href={route('invoices.show', inv.id)}
                                                            className="text-indigo-600 hover:underline"
                                                        >
                                                            {inv.bill_number}
                                                        </Link>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        {inv.party?.name}
                                                    </td>
                                                    <td className="px-6 py-3">{inv.invoice_date}</td>
                                                    <td className="px-6 py-3 text-right">
                                                        ₹ {formatMoney(inv.balance_amount)}
                                                    </td>
                                                    <td className="px-6 py-3 text-right capitalize">
                                                        {inv.status}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
        </div>
    );
}
