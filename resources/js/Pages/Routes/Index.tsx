import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { RouteLocation } from '@/types/transport';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Paginated {
    data: RouteLocation[];
}

interface Props {
    routes: Paginated;
    return_route?: string | null;
    return_id?: number | null;
    return_label?: string | null;
}

export default function RoutesIndex({
    routes,
    return_route,
    return_id,
    return_label,
}: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        return_route: return_route ?? '',
        return_id: return_id ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('routes.store'), {
            onSuccess: () => reset('name'),
        });
    };

    const destroy = (id: number) => {
        if (confirm('Remove this route from the list?')) {
            router.delete(route('routes.destroy', id));
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
                    <h2 className="text-xl font-semibold text-gray-800">Routes (From)</h2>
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
            <Head title="Routes" />

            <div className="py-8">
                <div className="mx-auto max-w-3xl space-y-6 sm:px-6 lg:px-8">
                    <p className="text-sm text-gray-600">
                        Add route / location names here (e.g. J N P T / SARIGAM / 1X20). They
                        appear in the invoice &quot;From&quot; dropdown after saving.
                    </p>

                    <form onSubmit={submit} className="rounded-lg bg-white p-6 shadow">
                        <h3 className="mb-4 font-medium text-gray-900">Add Route / Location</h3>
                        <div>
                            <InputLabel value="From (Route)" />
                            <input
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="J N P T / SARIGAM / 1X20"
                                required
                            />
                            <InputError message={errors.name} className="mt-1" />
                        </div>
                        <PrimaryButton className="mt-4" disabled={processing}>
                            Add Route
                        </PrimaryButton>
                    </form>

                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left font-medium text-gray-500">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-right font-medium text-gray-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {routes.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={2}
                                            className="px-6 py-8 text-center text-gray-500"
                                        >
                                            No routes yet.
                                        </td>
                                    </tr>
                                ) : (
                                    routes.data.map((r) => (
                                        <tr key={r.id}>
                                            <td className="px-6 py-3">{r.name}</td>
                                            <td className="px-6 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => destroy(r.id)}
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
