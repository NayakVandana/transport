import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import type { Customer } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function CustomersIndex() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadCustomers = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await appApiPost<
                ApiEnvelope<{ customers: { data: Customer[] } }>
            >('/customers/customers-list', {});

            if (!res.success || !res.data?.customers) {
                setError(res.message || 'Could not load customers.');
                return;
            }

            setCustomers(res.data.customers.data);
        } catch {
            setError('Could not load customers.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadCustomers();
    }, []);

    const destroy = async (id: number) => {
        if (!confirm('Delete this customer?')) {
            return;
        }

        const res = await appApiPost<ApiEnvelope<null>>('/customers/customer-destroy', { id });

        if (!res.success) {
            setError(res.message || 'Could not delete customer.');
            return;
        }

        void loadCustomers();
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">Customers</h2>
                    <Link href={route('customers.create')}>
                        <PrimaryButton>Add Customer</PrimaryButton>
                    </Link>
                </div>
            }
        >
            <Head title="Customers" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {error && (
                        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {error}
                        </p>
                    )}

                    {loading ? (
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
                                                No customers yet.
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
        </AuthenticatedLayout>
    );
}
