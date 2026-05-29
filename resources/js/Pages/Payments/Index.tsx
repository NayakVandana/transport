import ListExportButtons from '@/Components/ListExportButtons';
import ListFilterBar from '@/Components/ListFilterBar';
import PrimaryButton from '@/Components/PrimaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { defaultDateFilters, useFilteredList } from '@/hooks/useFilteredList';
import { usePageHeader } from '@/hooks/usePageHeader';
import { exportFilteredList } from '@/lib/listExport';
import { buildListFilterParams, type ListFilters } from '@/lib/listFilters';
import { formatMoney } from '@/lib/freightCalculator';
import type { Customer, ExpenseOption, Payment } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type PaymentFilters = ListFilters & {
    direction?: string;
    customer_id?: string;
    payment_method?: string;
};

type PaymentsListData = {
    payments: { data: Payment[] };
    total_receipts: number;
    total_payouts: number;
    customers: Pick<Customer, 'id' | 'name'>[];
    directions: ExpenseOption[];
    payment_methods: ExpenseOption[];
    filters: PaymentFilters;
    filterSummary: string;
};

const defaultFilters: PaymentFilters = {
    search: '',
    direction: '',
    customer_id: '',
    payment_method: '',
    ...defaultDateFilters,
};

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
    const [searchInput, setSearchInput] = useState('');

    usePageHeader(
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Payments</h2>
            <Link href={route('payments.create')}>
                <PrimaryButton>Record Payment</PrimaryButton>
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
    } = useFilteredList<PaymentsListData, PaymentFilters>({
        defaultFilters,
        extraFilterKeys: ['direction', 'customer_id', 'payment_method'],
        load: async (activeFilters) => {
            const res = await appApiPost<ApiEnvelope<PaymentsListData>>(
                '/payments/payments-list',
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

    const directionLabels = useMemo(() => {
        const map: Record<string, string> = {};
        for (const item of data?.directions ?? []) {
            map[item.value] = item.label;
        }

        return map;
    }, [data?.directions]);

    const methodLabels = useMemo(() => {
        const map: Record<string, string> = {};
        for (const item of data?.payment_methods ?? []) {
            map[item.value] = item.label;
        }

        return map;
    }, [data?.payment_methods]);

    const payments = data?.payments.data ?? [];

    const destroy = async (id: number) => {
        if (!confirm('Delete this payment?')) {
            return;
        }

        const res = await appApiPost<ApiEnvelope<null>>('/payments/payment-destroy', { id });

        if (!res.success) {
            setActionError(res.message || 'Could not delete payment.');
            return;
        }

        await fetchList();
    };

    const displayError = actionError ?? error;

    const exportFiltered = async (type: 'csv' | 'pdf') => {
        try {
            setActionError(null);
            await exportFilteredList('payments', type, { ...filters, search: searchInput });
        } catch {
            setActionError(`Could not export ${type.toUpperCase()}.`);
        }
    };

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

                    <ListFilterBar
                        dateValue={dateValue}
                        onDateChange={applyDateChange}
                        search={{
                            value: searchInput,
                            placeholder: 'Search reference, notes…',
                            onChange: setSearchInput,
                            onSubmit: () => applySearch(searchInput),
                        }}
                        selects={[
                            {
                                name: 'direction',
                                label: 'Type',
                                value: filters.direction ?? '',
                                options: (data?.directions ?? []).map((d) => ({
                                    value: d.value,
                                    label: d.label,
                                })),
                                onChange: (value) => updateField('direction', value),
                            },
                            {
                                name: 'customer_id',
                                label: 'Customer',
                                value: filters.customer_id ?? '',
                                widthClass: 'w-[10rem]',
                                options: (data?.customers ?? []).map((c) => ({
                                    value: String(c.id),
                                    label: c.name,
                                })),
                                onChange: (value) => updateField('customer_id', value),
                            },
                            {
                                name: 'payment_method',
                                label: 'Method',
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
                                                {hasActiveFilters
                                                    ? 'No payments match your filters.'
                                                    : 'No payments recorded yet.'}
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
