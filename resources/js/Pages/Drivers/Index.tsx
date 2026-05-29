import PrimaryButton from '@/Components/PrimaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { invalidateAppQuery, useAppQuery } from '@/hooks/useAppQuery';
import { usePageHeader } from '@/hooks/usePageHeader';
import { formatMoney } from '@/lib/freightCalculator';
import type { Driver } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

function formatDate(value?: string | null): string {
    if (!value) {
        return '—';
    }

    return value.slice(0, 10);
}

export default function DriversIndex() {
    const [actionError, setActionError] = useState<string | null>(null);

    usePageHeader(
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Drivers</h2>
            <Link href={route('drivers.create')}>
                <PrimaryButton>Add Driver</PrimaryButton>
            </Link>
        </div>,
    );

    const { data: drivers, loading, error, refresh } = useAppQuery(
        'drivers-list',
        async () => {
            const res = await appApiPost<
                ApiEnvelope<{ drivers: { data: Driver[] } }>
            >('/drivers/drivers-list', {});

            if (!res.success || !res.data?.drivers) {
                throw new Error(res.message || 'Could not load drivers.');
            }

            return res.data.drivers.data;
        },
    );

    const destroy = async (id: number) => {
        if (!confirm('Delete this driver?')) {
            return;
        }

        const res = await appApiPost<ApiEnvelope<null>>('/drivers/driver-destroy', { id });

        if (!res.success) {
            setActionError(res.message || 'Could not delete driver.');
            return;
        }

        invalidateAppQuery('drivers-list');
        await refresh();
    };

    const displayError = actionError ?? error;

    return (
        <>
            <Head title="Drivers" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {displayError && (
                        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {displayError}
                        </p>
                    )}

                    {loading && !drivers ? (
                        <p className="text-center text-sm text-gray-500">Loading drivers…</p>
                    ) : (
                        <div className="overflow-x-auto rounded-lg bg-white shadow">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-medium text-gray-500">Name</th>
                                        <th className="px-6 py-3 text-left font-medium text-gray-500">Mobile</th>
                                        <th className="px-6 py-3 text-left font-medium text-gray-500">Joining Date</th>
                                        <th className="px-6 py-3 text-right font-medium text-gray-500">Salary</th>
                                        <th className="px-6 py-3 text-left font-medium text-gray-500">License No</th>
                                        <th className="px-6 py-3 text-left font-medium text-gray-500">License Expiry</th>
                                        <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                                        <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {(drivers ?? []).length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                                No drivers yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        (drivers ?? []).map((driver) => (
                                            <tr key={driver.id}>
                                                <td className="px-6 py-3 font-medium">{driver.name}</td>
                                                <td className="px-6 py-3">{driver.mobile ?? '—'}</td>
                                                <td className="px-6 py-3">{formatDate(driver.joining_date)}</td>
                                                <td className="px-6 py-3 text-right">
                                                    {driver.salary != null && driver.salary !== ''
                                                        ? `₹ ${formatMoney(driver.salary)}`
                                                        : '—'}
                                                </td>
                                                <td className="px-6 py-3">{driver.license_number ?? '—'}</td>
                                                <td className="px-6 py-3">{formatDate(driver.license_expiry)}</td>
                                                <td className="px-6 py-3">
                                                    <span
                                                        className={
                                                            driver.status === 'active'
                                                                ? 'text-green-700'
                                                                : 'text-gray-500'
                                                        }
                                                    >
                                                        {driver.status === 'active' ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="space-x-3 px-6 py-3 text-right">
                                                    <Link
                                                        href={route('drivers.edit', driver.id)}
                                                        className="text-indigo-600 hover:underline"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => void destroy(driver.id)}
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
