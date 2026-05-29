import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import type { RouteLocation } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

function useInvoiceReturn() {
    return useMemo(() => {
        const params = new URLSearchParams(window.location.search);

        return {
            return_route: params.get('return_route'),
            return_id: params.get('return_id') ? Number(params.get('return_id')) : null,
            return_label: params.get('return_label'),
        };
    }, []);
}

function apiFieldErrors(data: unknown): Record<string, string> {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return {};
    }

    const errors: Record<string, string> = {};
    for (const [key, val] of Object.entries(data)) {
        if (Array.isArray(val) && val[0]) {
            errors[key] = String(val[0]);
        } else if (typeof val === 'string') {
            errors[key] = val;
        }
    }

    return errors;
}

export default function RoutesIndex() {
    const { return_route, return_id, return_label } = useInvoiceReturn();
    const [routes, setRoutes] = useState<RouteLocation[]>([]);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const loadRoutes = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await appApiPost<
                ApiEnvelope<{ routes: { data: RouteLocation[] } }>
            >('/routes/routes-list', {});

            if (!res.success || !res.data?.routes) {
                setError(res.message || 'Could not load routes.');
                return;
            }

            setRoutes(res.data.routes.data);
        } catch {
            setError('Could not load routes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadRoutes();
    }, []);

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setFieldErrors({});
        setProcessing(true);

        try {
            const res = await appApiPost<ApiEnvelope<{ route: RouteLocation }>>(
                '/routes/route-store',
                { name },
            );

            if (!res.success) {
                setFieldErrors(apiFieldErrors(res.data));
                if (!res.data) {
                    setError(res.message || 'Could not add route.');
                }
                return;
            }

            setName('');
            void loadRoutes();
        } catch {
            setError('Could not add route.');
        } finally {
            setProcessing(false);
        }
    };

    const destroy = async (id: number) => {
        if (!confirm('Remove this route from the list?')) {
            return;
        }

        const res = await appApiPost<ApiEnvelope<null>>('/routes/route-destroy', { id });

        if (!res.success) {
            setError(res.message || 'Could not remove route.');
            return;
        }

        void loadRoutes();
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

                    {error && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {error}
                        </p>
                    )}

                    <form onSubmit={submit} className="rounded-lg bg-white p-6 shadow">
                        <h3 className="mb-4 font-medium text-gray-900">Add Route / Location</h3>
                        <div>
                            <InputLabel value="From (Route)" />
                            <input
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="J N P T / SARIGAM / 1X20"
                                required
                            />
                            <InputError message={fieldErrors.name} className="mt-1" />
                        </div>
                        <PrimaryButton className="mt-4" disabled={processing}>
                            Add Route
                        </PrimaryButton>
                    </form>

                    {loading ? (
                        <p className="text-center text-sm text-gray-500">Loading routes…</p>
                    ) : (
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
                                    {routes.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={2}
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                No routes yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        routes.map((r) => (
                                            <tr key={r.id}>
                                                <td className="px-6 py-3">{r.name}</td>
                                                <td className="px-6 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => void destroy(r.id)}
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
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
