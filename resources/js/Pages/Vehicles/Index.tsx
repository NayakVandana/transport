import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { Vehicle } from '@/types/transport';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Paginated {
    data: Vehicle[];
}

interface Props {
    vehicles: Paginated;
    return_route?: string | null;
    return_id?: number | null;
    return_label?: string | null;
}

export default function VehiclesIndex({
    vehicles,
    return_route,
    return_id,
    return_label,
}: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        number: '',
        description: '',
        return_route: return_route ?? '',
        return_id: return_id ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('vehicles.store'), {
            onSuccess: () => {
                reset('number', 'description');
            },
        });
    };

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

    return (
        <AuthenticatedLayout
            header={
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
            }
        >
            <Head title="Vehicles" />

            <div className="py-8">
                <div className="mx-auto max-w-3xl space-y-6 sm:px-6 lg:px-8">
                    <p className="text-sm text-gray-600">
                        Add and manage vehicles here. They appear in the invoice dropdown after
                        saving.
                    </p>

                    <form onSubmit={submit} className="rounded-lg bg-white p-6 shadow">
                        <h3 className="mb-4 font-medium text-gray-900">Add Vehicle</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel value="Vehicle Number" />
                                <input
                                    className="mt-1 block w-full rounded-md border-gray-300 uppercase shadow-sm"
                                    value={data.number}
                                    onChange={(e) =>
                                        setData('number', e.target.value.toUpperCase())
                                    }
                                    placeholder="MH04JU9931"
                                    required
                                />
                                <InputError message={errors.number} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value="Description (optional)" />
                                <input
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                />
                            </div>
                        </div>
                        <PrimaryButton className="mt-4" disabled={processing}>
                            Add Vehicle
                        </PrimaryButton>
                    </form>

                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left font-medium text-gray-500">
                                        Number
                                    </th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-500">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-right font-medium text-gray-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {vehicles.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="px-6 py-8 text-center text-gray-500"
                                        >
                                            No vehicles yet.
                                        </td>
                                    </tr>
                                ) : (
                                    vehicles.data.map((v) => (
                                        <tr key={v.id}>
                                            <td className="px-6 py-3 font-mono font-medium">
                                                {v.number}
                                            </td>
                                            <td className="px-6 py-3 text-gray-600">
                                                {v.description ?? '—'}
                                            </td>
                                            <td className="px-6 py-3 text-right">
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
