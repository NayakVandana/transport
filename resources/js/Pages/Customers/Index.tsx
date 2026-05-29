import ListFilterBar from '@/Components/ListFilterBar';
import PrimaryButton from '@/Components/PrimaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { defaultDateFilters, useFilteredList } from '@/hooks/useFilteredList';
import { usePageHeader } from '@/hooks/usePageHeader';
import { buildListFilterParams, type ListFilters } from '@/lib/listFilters';
import type { Customer } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

type CustomerFilters = ListFilters;

type CustomersListData = {
    customers: { data: Customer[] };
    filters: CustomerFilters;
    filterSummary: string;
};

const defaultFilters: CustomerFilters = {
    search: '',
    ...defaultDateFilters,
};

export default function CustomersIndex() {
    const [actionError, setActionError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');

    usePageHeader(
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Customers</h2>
            <Link href={route('customers.create')}>
                <PrimaryButton>Add Customer</PrimaryButton>
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
        clearFilters,
        fetchList,
    } = useFilteredList<CustomersListData, CustomerFilters>({
        defaultFilters,
        load: async (activeFilters) => {
            const res = await appApiPost<ApiEnvelope<CustomersListData>>(
                '/customers/customers-list',
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

    const customers = data?.customers.data ?? [];

    const destroy = async (id: number) => {
        if (!confirm('Delete this customer?')) {
            return;
        }

        const res = await appApiPost<ApiEnvelope<null>>('/customers/customer-destroy', { id });

        if (!res.success) {
            setActionError(res.message || 'Could not delete customer.');
            return;
        }

        await fetchList();
    };

    const displayError = actionError ?? error;

    return (
        <>
            <Head title="Customers" />

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
                            placeholder: 'Search name or mobile…',
                            onChange: setSearchInput,
                            onSubmit: () => applySearch(searchInput),
                        }}
                        filterSummary={filterSummary}
                        hasActiveFilters={hasActiveFilters}
                        onClear={() => {
                            setSearchInput('');
                            clearFilters();
                        }}
                    />

                    {loading && !data ? (
                        <p className="text-center text-sm text-gray-500">Loading customers…</p>
                    ) : (
                        <div className="overflow-hidden rounded-lg bg-white shadow">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-medium text-gray-500">Name</th>
                                        <th className="px-6 py-3 text-left font-medium text-gray-500">Mobile</th>
                                        <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {customers.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                                {hasActiveFilters
                                                    ? 'No customers match your filters.'
                                                    : 'No customers yet.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        customers.map((c) => (
                                            <tr key={c.id}>
                                                <td className="px-6 py-3 font-medium">{c.name}</td>
                                                <td className="px-6 py-3">{c.mobile}</td>
                                                <td className="space-x-3 px-6 py-3 text-right">
                                                    <Link
                                                        href={route('customers.edit', c.id)}
                                                        className="text-indigo-600 hover:underline"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => void destroy(c.id)}
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
