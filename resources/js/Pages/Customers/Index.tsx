import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { Customer } from '@/types/transport';
import { Head, Link, router } from '@inertiajs/react';

interface Paginated {
    data: Customer[];
    links: { url: string | null; label: string; active: boolean }[];
}

export default function CustomersIndex({ customers }: { customers: Paginated }) {
    const destroy = (id: number) => {
        if (confirm('Delete this customer?')) {
            router.delete(route('customers.destroy', id));
        }
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
                                {customers.data.map((c) => (
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
                                                onClick={() => destroy(c.id)}
                                                className="text-red-600 hover:underline"
                                            >
                                                Delete
                                            </button>
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
