import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { invoiceReturnQuery } from '@/lib/invoiceReturn';
import type { Vehicle } from '@/types/transport';
import { Head, Link, router } from '@inertiajs/react';

interface Paginated {
    data: Vehicle[];
}

interface Props {
    vehicles: Paginated;
    return_route?: string | null;
    return_id?: number | null;
    return_label?: string | null;
}

function formatDate(value?: string | null): string {
    if (!value) return '—';
    return value.slice(0, 10);
}

export default function VehiclesIndex({
    vehicles,
    return_route,
    return_id,
    return_label,
}: Props) {
    const destroy = (id: number) => {
        if (confirm('Remove this vehicle from the list?')) {
            router.delete(route('vehicles.destroy', id));
        }
    };

    const backHref =
        return_route && route().has(return_route)
            ? route(
                  return_route,
                  return_id && return_route === 'invoices.edit'
                      ? { invoice: return_id }
                      : {},
              )
            : null;

    const createHref = route(
        'vehicles.create',
        return_route
            ? invoiceReturnQuery(return_route === 'invoices.edit', return_id ?? undefined)
            : {},
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-semibold text-gray-800">Vehicles</h2>
                        {backHref && (
                            <Link href={backHref}>
                                <SecondaryButton type="button">
                                    {return_label ?? 'Back to invoice'}
                                </SecondaryButton>
                            </Link>
                        )}
                    </div>
                    <Link href={createHref}>
                        <PrimaryButton>Add Vehicle</PrimaryButton>
                    </Link>
                </div>
            }
        >
            <Head title="Vehicles" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <p className="text-sm text-gray-600">
                        Manage vehicle details, insurance, and permit expiry dates. Active vehicles
                        appear in the invoice dropdown.
                    </p>

                    <div className="overflow-x-auto rounded-lg bg-white shadow">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Number
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Type
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Brand / Model
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Insurance Expiry
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Permit Expiry
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {vehicles.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-8 text-center text-gray-500"
                                        >
                                            No vehicles yet.
                                        </td>
                                    </tr>
                                ) : (
                                    vehicles.data.map((v) => (
                                        <tr key={v.id}>
                                            <td className="px-4 py-3 font-mono font-medium">
                                                {v.vehicle_number}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {v.vehicle_type ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {[v.brand, v.model].filter(Boolean).join(' ') ||
                                                    '—'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {formatDate(v.insurance_expiry)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {formatDate(v.permit_expiry)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={
                                                        v.status === 'active'
                                                            ? 'text-green-700'
                                                            : 'text-gray-500'
                                                    }
                                                >
                                                    {v.status === 'active' ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="space-x-3 px-4 py-3 text-right">
                                                <Link
                                                    href={route('vehicles.edit', v.id)}
                                                    className="text-indigo-600 hover:underline"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => destroy(v.id)}
                                                    className="text-red-600 hover:underline"
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
