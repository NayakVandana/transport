import PrimaryButton from '@/Components/PrimaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { invalidateAppQuery, useAppQuery } from '@/hooks/useAppQuery';
import { usePageHeader } from '@/hooks/usePageHeader';
import { formatMoney } from '@/lib/freightCalculator';
import type { ExpenseOption, Payment } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

function formatDate(value?: string | null): string {
    if (!value) {
        return '—';
    }

    return value.slice(0, 10);
}

function formatMethod(method?: string | null): string {
    if (!method) {
        return '—';
    }

    return method.toUpperCase();
}

export default function PaymentsIndex() {
    const [actionError, setActionError] = useState<string | null>(null);

    usePageHeader(
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Payments</h2>
            <Link href={route('payments.create')}>
                <PrimaryButton>Record Payment</PrimaryButton>
            </Link>
        </div>,
    );

    const { data, loading, error, refresh } = useAppQuery(
        'payments-list',
        async () => {
            const res = await appApiPost<
                ApiEnvelope<{
                    payments: { data: Payment[] };
                    total_receipts: number;
                    total_payouts: number;
                }>
            >('/payments/payments-list', {});

            if (!res.success || !res.data?.payments) {
                throw new Error(res.message || 'Could not load payments.');
            }

            return res.data;
        },
    );

    const { data: meta } = useAppQuery('payments-meta-labels', async () => {
        const res = await appApiPost<
            ApiEnvelope<{ directions: ExpenseOption[]; payment_methods: ExpenseOption[] }>
        >('/payments/payment-meta', {});

        if (!res.success || !res.data) {
            return {
                directions: [] as ExpenseOption[],
                payment_methods: [] as ExpenseOption[],
            };
        }

        return {
            directions: res.data.directions ?? [],
            payment_methods: res.data.payment_methods ?? [],
        };
    });

    const directionLabels = useMemo(() => {
        const map: Record<string, string> = {};
        for (const item of meta?.directions ?? []) {
            map[item.value] = item.label;
        }

        return map;
    }, [meta?.directions]);

    const methodLabels = useMemo(() => {
        const map: Record<string, string> = {};
        for (const item of meta?.payment_methods ?? []) {
            map[item.value] = item.label;
        }

        return map;
    }, [meta?.payment_methods]);

    const destroy = async (id: number) => {
        if (!confirm('Delete this payment?')) {
            return;
        }

        const res = await appApiPost<ApiEnvelope<null>>('/payments/payment-destroy', { id });

        if (!res.success) {
            setActionError(res.message || 'Could not delete payment.');
            return;
        }

        invalidateAppQuery('payments-list');
        await refresh();
    };

    const displayError = actionError ?? error;
    const payments = data?.payments.data ?? [];

    return (
        <>
            <Head title="Payments" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-4 sm:px-6 lg:px-8">
                    {displayError && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {displayError}
                        </p>
                    )}

                    {data && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-lg bg-white p-4 shadow">
                                <p className="text-sm text-gray-500">Total receipts</p>
                                <p className="text-2xl font-semibold text-green-700">
                                    ₹ {formatMoney(data.total_receipts)}
                                </p>
                            </div>
                            <div className="rounded-lg bg-white p-4 shadow">
                                <p className="text-sm text-gray-500">Total payouts</p>
                                <p className="text-2xl font-semibold text-red-700">
                                    ₹ {formatMoney(data.total_payouts)}
                                </p>
                            </div>
                        </div>
                    )}

                    {loading && !data ? (
                        <p className="text-center text-sm text-gray-500">Loading payments…</p>
                    ) : (
                        <div className="overflow-x-auto rounded-lg bg-white shadow">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Linked to</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Method</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Reference</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Amount</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {payments.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                                No payments recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        payments.map((payment) => {
                                            const linked =
                                                payment.freight_invoice?.bill_number
                                                    ? `Invoice ${payment.freight_invoice.bill_number}`
                                                    : payment.booking
                                                      ? `Booking ${formatDate(payment.booking.booking_date)}${
                                                            payment.booking.vehicle?.vehicle_number
                                                                ? ` · ${payment.booking.vehicle.vehicle_number}`
                                                                : ''
                                                        }`
                                                      : '—';

                                            return (
                                                <tr key={payment.id}>
                                                    <td className="px-4 py-3">
                                                        {formatDate(payment.payment_date)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={
                                                                payment.direction === 'receipt'
                                                                    ? 'text-green-700'
                                                                    : 'text-red-700'
                                                            }
                                                        >
                                                            {directionLabels[payment.direction] ??
                                                                payment.direction}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {payment.customer?.name ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600">{linked}</td>
                                                    <td className="px-4 py-3">
                                                        {methodLabels[payment.payment_method] ??
                                                            formatMethod(payment.payment_method)}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600">
                                                        {payment.reference_number || '—'}
                                                    </td>
                                                    <td
                                                        className={`px-4 py-3 text-right font-medium ${
                                                            payment.direction === 'receipt'
                                                                ? 'text-green-700'
                                                                : 'text-red-700'
                                                        }`}
                                                    >
                                                        {payment.direction === 'payout' ? '−' : '+'} ₹{' '}
                                                        {formatMoney(payment.amount)}
                                                    </td>
                                                    <td className="space-x-3 px-4 py-3 text-right">
                                                        <Link
                                                            href={route('payments.edit', payment.id)}
                                                            className="text-indigo-600 hover:underline"
                                                        >
                                                            Edit
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => void destroy(payment.id)}
                                                            className="text-red-600 hover:underline"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
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
