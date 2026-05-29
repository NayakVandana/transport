import PrimaryButton from '@/Components/PrimaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { invalidateAppQuery, useAppQuery } from '@/hooks/useAppQuery';
import { usePageHeader } from '@/hooks/usePageHeader';
import type { Customer } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function CustomersIndex() {
    const [actionError, setActionError] = useState<string | null>(null);

    usePageHeader(
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Customers</h2>
            <Link href={route('customers.create')}>
                <PrimaryButton>Add Customer</PrimaryButton>
            </Link>
        </div>,
    );

    const { data: customers, loading, error, refresh } = useAppQuery(
        'customers-list',
        async () => {
            const res = await appApiPost<
                ApiEnvelope<{ customers: { data: Customer[] } }>
            >('/customers/customers-list', {});

            if (!res.success || !res.data?.customers) {
                throw new Error(res.message || 'Could not load customers.');
            }

            return res.data.customers.data;
        },
    );

    const destroy = async (id: number) => {
        if (!confirm('Delete this customer?')) {
            return;
        }

        const res = await appApiPost<ApiEnvelope<null>>('/customers/customer-destroy', { id });

        if (!res.success) {
            setActionError(res.message || 'Could not delete customer.');
            return;
        }

        invalidateAppQuery('customers-list');
        await refresh();
    };

    const displayError = actionError ?? error;

    return (
        <>
            <Head title="Customers" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {displayError && (
                        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {displayError}
                        </p>
                    )}

                    {loading && !customers ? (
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
                                    {(customers ?? []).length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                                No customers yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        (customers ?? []).map((c) => (
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
