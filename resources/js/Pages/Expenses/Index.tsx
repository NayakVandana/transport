import PrimaryButton from '@/Components/PrimaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { invalidateAppQuery, useAppQuery } from '@/hooks/useAppQuery';
import { usePageHeader } from '@/hooks/usePageHeader';
import { formatMoney } from '@/lib/freightCalculator';
import type { Expense, ExpenseOption } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

function formatDate(value?: string | null): string {
    if (!value) {
        return '—';
    }

    return value.slice(0, 10);
}

function formatPayment(method?: string | null): string {
    if (!method) {
        return '—';
    }

    return method.toUpperCase();
}

export default function ExpensesIndex() {
    const [actionError, setActionError] = useState<string | null>(null);

    usePageHeader(
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Expenses</h2>
            <Link href={route('expenses.create')}>
                <PrimaryButton>Add Expense</PrimaryButton>
            </Link>
        </div>,
    );

    const { data, loading, error, refresh } = useAppQuery(
        'expenses-list',
        async () => {
            const res = await appApiPost<
                ApiEnvelope<{
                    expenses: { data: Expense[] };
                    total_amount: number;
                }>
            >('/expenses/expenses-list', {});

            if (!res.success || !res.data?.expenses) {
                throw new Error(res.message || 'Could not load expenses.');
            }

            return res.data;
        },
    );

    const { data: meta } = useAppQuery('expenses-meta-labels', async () => {
        const res = await appApiPost<
            ApiEnvelope<{ categories: ExpenseOption[] }>
        >('/expenses/expense-meta', {});

        if (!res.success || !res.data?.categories) {
            return { categories: [] as ExpenseOption[] };
        }

        return { categories: res.data.categories };
    });

    const categoryLabels = useMemo(() => {
        const map: Record<string, string> = {};
        for (const item of meta?.categories ?? []) {
            map[item.value] = item.label;
        }

        return map;
    }, [meta?.categories]);

    const destroy = async (id: number) => {
        if (!confirm('Delete this expense?')) {
            return;
        }

        const res = await appApiPost<ApiEnvelope<null>>('/expenses/expense-destroy', { id });

        if (!res.success) {
            setActionError(res.message || 'Could not delete expense.');
            return;
        }

        invalidateAppQuery('expenses-list');
        await refresh();
    };

    const displayError = actionError ?? error;
    const expenses = data?.expenses.data ?? [];

    return (
        <>
            <Head title="Expenses" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-4 sm:px-6 lg:px-8">
                    {displayError && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {displayError}
                        </p>
                    )}

                    {data && (
                        <div className="rounded-lg bg-white p-4 shadow">
                            <p className="text-sm text-gray-500">Total expenses</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                ₹ {formatMoney(data.total_amount)}
                            </p>
                        </div>
                    )}

                    {loading && !data ? (
                        <p className="text-center text-sm text-gray-500">Loading expenses…</p>
                    ) : (
                        <div className="overflow-x-auto rounded-lg bg-white shadow">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Category</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Description</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Vehicle</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Driver</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Payment</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Bill</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Amount</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {expenses.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                                                No expenses yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        expenses.map((expense) => (
                                            <tr key={expense.id}>
                                                <td className="px-4 py-3">{formatDate(expense.expense_date)}</td>
                                                <td className="px-4 py-3">
                                                    {categoryLabels[expense.category] ?? expense.category}
                                                </td>
                                                <td className="max-w-xs truncate px-4 py-3 text-gray-600">
                                                    {expense.description || '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {expense.vehicle?.vehicle_number ?? '—'}
                                                </td>
                                                <td className="px-4 py-3">{expense.driver?.name ?? '—'}</td>
                                                <td className="px-4 py-3">{formatPayment(expense.payment_method)}</td>
                                                <td className="px-4 py-3">
                                                    {expense.bill_copy_url ? (
                                                        <a
                                                            href={expense.bill_copy_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-indigo-600 hover:underline"
                                                        >
                                                            View
                                                        </a>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium">
                                                    ₹ {formatMoney(expense.amount)}
                                                </td>
                                                <td className="space-x-3 px-4 py-3 text-right">
                                                    <Link
                                                        href={route('expenses.edit', expense.id)}
                                                        className="text-indigo-600 hover:underline"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => void destroy(expense.id)}
                                                        className="text-red-600 hover:underline"
                                                    >
                                                        Delete
                                                    </button>
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
