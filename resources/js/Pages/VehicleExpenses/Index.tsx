import PageContainer from '@/Components/PageContainer';
import ListExportButtons from '@/Components/ListExportButtons';
import ListFilterBar from '@/Components/ListFilterBar';
import PrimaryButton from '@/Components/PrimaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { defaultDateFilters, useFilteredList } from '@/hooks/useFilteredList';
import { usePageHeader } from '@/hooks/usePageHeader';
import { exportFilteredList } from '@/lib/listExport';
import { buildListFilterParams, type ListFilters } from '@/lib/listFilters';
import { formatAppCreatedAt, formatAppDateTime } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/freightCalculator';
import type { Vehicle, VehicleExpense, VehicleExpenseTotals } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

type VehicleExpenseFilters = ListFilters & {
    vehicle_id?: string;
};

type VehicleExpensesListData = {
    vehicleExpenses: { data: VehicleExpense[] };
    vehicles: Pick<Vehicle, 'id' | 'vehicle_number'>[];
    filters: VehicleExpenseFilters;
    totals: VehicleExpenseTotals;
    filterSummary: string;
};

const defaultFilters: VehicleExpenseFilters = {
    search: '',
    vehicle_id: '',
    ...defaultDateFilters,
};

const emptyTotals: VehicleExpenseTotals = {
    count: 0,
    freight: 0,
    advance: 0,
    empty_charge: 0,
    toll: 0,
    maintenance: 0,
    balance: 0,
};

function TotalCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg bg-white p-3 shadow">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
        </div>
    );
}

export default function VehicleExpensesIndex() {
    const [actionError, setActionError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');

    usePageHeader(
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Vehicle Expenses</h2>
            <Link href={route('vehicle-expenses.create')}>
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
    } = useFilteredList<VehicleExpensesListData, VehicleExpenseFilters>({
        defaultFilters,
        extraFilterKeys: ['vehicle_id'],
        load: async (activeFilters) => {
            const res = await appApiPost<ApiEnvelope<VehicleExpensesListData>>(
                '/vehicle-expenses/vehicle-expenses-list',
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

    const rows = data?.vehicleExpenses.data ?? [];
    const totals = data?.totals ?? emptyTotals;

    const destroy = async (id: number) => {
        if (!confirm('Remove this vehicle expense?')) {
            return;
        }

        const res = await appApiPost<ApiEnvelope<null>>('/vehicle-expenses/vehicle-expense-destroy', {
            id,
        });

        if (!res.success) {
            setActionError(res.message || 'Could not remove vehicle expense.');
            return;
        }

        await fetchList();
    };

    const displayError = actionError ?? error;

    const exportFiltered = async (type: 'csv' | 'pdf') => {
        try {
            setActionError(null);
            await exportFilteredList('vehicle-expenses', type, { ...filters, search: searchInput });
        } catch {
            setActionError(`Could not export ${type.toUpperCase()}.`);
        }
    };

    return (
        <>
            <Head title="Vehicle Expenses" />

            <PageContainer className="space-y-4">
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
                            placeholder: 'Search vehicle number…',
                            onChange: setSearchInput,
                            onSubmit: () => applySearch(searchInput),
                        }}
                        selects={[
                            {
                                name: 'vehicle_id',
                                label: 'Vehicle',
                                value: filters.vehicle_id ?? '',
                                options: (data?.vehicles ?? []).map((v) => ({
                                    value: String(v.id),
                                    label: v.vehicle_number,
                                })),
                                onChange: (value) => updateField('vehicle_id', value),
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

                    {loading && !data ? (
                        <p className="text-center text-sm text-gray-500">Loading vehicle expenses…</p>
                    ) : (
                        <>
                            {totals.count > 0 && (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                                    <TotalCard label="Records" value={String(totals.count)} />
                                    <TotalCard label="Freight" value={`₹ ${formatMoney(totals.freight)}`} />
                                    <TotalCard label="Advance" value={`₹ ${formatMoney(totals.advance)}`} />
                                    <TotalCard label="Empty" value={`₹ ${formatMoney(totals.empty_charge)}`} />
                                    <TotalCard label="Toll" value={`₹ ${formatMoney(totals.toll)}`} />
                                    <TotalCard
                                        label="Maintenance"
                                        value={`₹ ${formatMoney(totals.maintenance)}`}
                                    />
                                    <TotalCard label="Balance" value={`₹ ${formatMoney(totals.balance)}`} />
                                </div>
                            )}

                            <div className="overflow-x-auto rounded-lg bg-white shadow">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">Vehicle</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">Freight</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">Advance</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">Empty</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">Toll</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                                                Maintenance
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">Balance</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">Created</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {rows.length === 0 ? (
                                            <tr>
                                                <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                                                    {hasActiveFilters
                                                        ? 'No vehicle expenses match your filters.'
                                                        : 'No vehicle expenses yet.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            rows.map((row) => (
                                                <tr key={row.id}>
                                                    <td className="px-4 py-3">
                                                        {formatAppDateTime(row.expense_date)}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono">
                                                        {row.vehicle?.vehicle_number ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        ₹ {formatMoney(row.freight)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        ₹ {formatMoney(row.advance)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        ₹ {formatMoney(row.empty_charge)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        ₹ {formatMoney(row.toll)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        ₹ {formatMoney(row.maintenance)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">
                                                        ₹ {formatMoney(row.balance)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                                        {formatAppCreatedAt(row.created_at)}
                                                    </td>
                                                    <td className="space-x-3 px-4 py-3 text-right">
                                                        <Link
                                                            href={route('vehicle-expenses.edit', row.id)}
                                                            className="text-indigo-600 hover:underline"
                                                        >
                                                            Edit
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => void destroy(row.id)}
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
                        </>
                    )}
            </PageContainer>
        </>
    );
}
