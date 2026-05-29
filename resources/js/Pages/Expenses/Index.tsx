import ListExportButtons from '@/Components/ListExportButtons';
import ListFilterBar from '@/Components/ListFilterBar';
import PrimaryButton from '@/Components/PrimaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { defaultDateFilters, useFilteredList } from '@/hooks/useFilteredList';
import { usePageHeader } from '@/hooks/usePageHeader';
import { exportFilteredList } from '@/lib/listExport';
import { buildListFilterParams, type ListFilters } from '@/lib/listFilters';
import { formatMoney } from '@/lib/freightCalculator';
import type { Expense, ExpenseOption, Vehicle } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type ExpenseFilters = ListFilters & {
    category?: string;
    vehicle_id?: string;
    payment_method?: string;
};

type ExpensesListData = {
    expenses: { data: Expense[] };
    total_amount: number;
    vehicles: Pick<Vehicle, 'id' | 'vehicle_number'>[];
    categories: ExpenseOption[];
    payment_methods: ExpenseOption[];
    filters: ExpenseFilters;
    filterSummary: string;
};

const defaultFilters: ExpenseFilters = {
    search: '',
    category: '',
    vehicle_id: '',
    payment_method: '',
    ...defaultDateFilters,
};

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
    const [searchInput, setSearchInput] = useState('');

    usePageHeader(
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Expenses</h2>
            <Link href={route('expenses.create')}>
                <PrimaryButton>Add Expense</PrimaryButton>
            </Link>
        </div>,
    );

    const {
        data,
        filters,
        filterSummary,
        dateValue,
        loading,
        error,
        hasActiveFilters,
        applyDateChange,
        applySearch,
        updateField,
        clearFilters,
        fetchList,
    } = useFilteredList<ExpensesListData, ExpenseFilters>({
        defaultFilters,
        extraFilterKeys: ['category', 'vehicle_id', 'payment_method'],
        load: async (activeFilters) => {
            const res = await appApiPost<ApiEnvelope<ExpensesListData>>(
                '/expenses/expenses-list',
                buildListFilterParams(activeFilters),
            );

            return {
                success: res.success,
                data: res.data,
                message: res.message,
                filters: res.data?.filters,
                filterSummary: res.data?.filterSummary,
            };
        },
    });

    const categoryLabels = useMemo(() => {
        const map: Record<string, string> = {};
        for (const item of data?.categories ?? []) {
            map[item.value] = item.label;
        }

        return map;
    }, [data?.categories]);

    const expenses = data?.expenses.data ?? [];

    const destroy = async (id: number) => {
        if (!confirm('Delete this expense?')) {
            return;
        }

        const res = await appApiPost<ApiEnvelope<null>>('/expenses/expense-destroy', { id });

        if (!res.success) {
            setActionError(res.message || 'Could not delete expense.');
            return;
        }

        await fetchList();
    };

    const displayError = actionError ?? error;

    const exportFiltered = async (type: 'csv' | 'pdf') => {
        try {
            setActionError(null);
            await exportFilteredList('expenses', type, { ...filters, search: searchInput });
        } catch {
            setActionError(`Could not export ${type.toUpperCase()}.`);
        }
    };

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

                    <ListFilterBar
                        dateValue={dateValue}
                        onDateChange={applyDateChange}
                        search={{
                            value: searchInput,
                            placeholder: 'Search description…',
                            onChange: setSearchInput,
                            onSubmit: () => applySearch(searchInput),
                        }}
                        selects={[
                            {
                                name: 'category',
                                label: 'Category',
                                value: filters.category ?? '',
                                widthClass: 'w-[10rem]',
                                options: (data?.categories ?? []).map((c) => ({
                                    value: c.value,
                                    label: c.label,
                                })),
                                onChange: (value) => updateField('category', value),
                            },
                            {
                                name: 'vehicle_id',
                                label: 'Vehicle',
                                value: filters.vehicle_id ?? '',
                                widthClass: 'w-[10rem]',
                                options: (data?.vehicles ?? []).map((v) => ({
                                    value: String(v.id),
                                    label: v.vehicle_number,
                                })),
                                onChange: (value) => updateField('vehicle_id', value),
                            },
                            {
                                name: 'payment_method',
                                label: 'Payment',
                                value: filters.payment_method ?? '',
                                options: (data?.payment_methods ?? []).map((m) => ({
                                    value: m.value,
                                    label: m.label,
                                })),
                                onChange: (value) => updateField('payment_method', value),
                            },
                        ]}
                        filterSummary={filterSummary}
                        hasActiveFilters={hasActiveFilters}
                        onClear={() => {
                            setSearchInput('');
                            clearFilters();
                        }}
                        actions={
                            <ListExportButtons onExport={(type) => void exportFiltered(type)} />
                        }
                    />

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
                                                {hasActiveFilters
                                                    ? 'No expenses match your filters.'
                                                    : 'No expenses yet.'}
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
