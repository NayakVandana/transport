import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { invalidateAppQuery } from '@/hooks/useAppQuery';
import { usePageHeader } from '@/hooks/usePageHeader';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import type { Customer } from '@/types/transport';
import { Head, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

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

export default function CustomerForm({ customerId }: { customerId?: number }) {
    const isEdit = Boolean(customerId);

    usePageHeader(
        <h2 className="text-xl font-semibold text-gray-800">
            {isEdit ? 'Edit Customer' : 'New Customer'}
        </h2>,
    );

    const [loading, setLoading] = useState(Boolean(customerId));
    const [loadError, setLoadError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [data, setData] = useState({
        name: '',
        mobile: '',
        address: '',
        state_code: '',
    });

    useEffect(() => {
        if (!customerId) {
            return;
        }

        setLoading(true);

        void appApiPost<ApiEnvelope<{ customer: Customer }>>('/customers/customer-show', {
            id: customerId,
        })
            .then((res) => {
                if (!res.success || !res.data?.customer) {
                    setLoadError(res.message || 'Could not load customer.');
                    return;
                }

                const customer = res.data.customer;
                setData({
                    name: customer.name ?? '',
                    mobile: customer.mobile ?? '',
                    address: customer.address ?? '',
                    state_code: customer.state_code ?? '',
                });
            })
            .catch(() => {
                setLoadError('Could not load customer.');
            })
            .finally(() => setLoading(false));
    }, [customerId]);

    const setField = (field: keyof typeof data, value: string) => {
        setData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setErrors({});
        setProcessing(true);

        try {
            const payload = {
                ...data,
                ...(customerId ? { id: customerId } : {}),
            };

            const res = await appApiPost<ApiEnvelope<{ customer: Customer }>>(
                customerId ? '/customers/customer-update' : '/customers/customer-store',
                payload,
            );

            if (!res.success) {
                setErrors(apiFieldErrors(res.data));
                if (!res.data) {
                    setLoadError(res.message || 'Could not save customer.');
                }
                return;
            }

            invalidateAppQuery('customers-list');
            router.visit(route('customers.index'));
        } catch {
            setLoadError('Could not save customer.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <Head title={isEdit ? 'Edit Customer' : 'New Customer'} />

            <div className="py-8">
                <div className="mx-auto max-w-xl sm:px-6 lg:px-8">
                    {loading ? (
                        <p className="text-center text-sm text-gray-500">Loading…</p>
                    ) : loadError ? (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {loadError}
                        </p>
                    ) : (
                        <form onSubmit={submit} className="space-y-4 rounded-lg bg-white p-6 shadow">
                            <div>
                                <InputLabel value="Name" />
                                <TextInput
                                    className="mt-1 block w-full"
                                    value={data.name}
                                    onChange={(e) => setField('name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.name} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value="Mobile" />
                                <TextInput
                                    className="mt-1 block w-full"
                                    value={data.mobile}
                                    onChange={(e) => setField('mobile', e.target.value)}
                                />
                                <InputError message={errors.mobile} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value="Address" />
                                <textarea
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows={4}
                                    value={data.address}
                                    onChange={(e) => setField('address', e.target.value)}
                                />
                                <InputError message={errors.address} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value="State Code" />
                                <TextInput
                                    className="mt-1 block w-full"
                                    value={data.state_code}
                                    onChange={(e) => setField('state_code', e.target.value)}
                                    placeholder="e.g. 27"
                                />
                                <InputError message={errors.state_code} className="mt-1" />
                            </div>
                            <PrimaryButton disabled={processing}>
                                {isEdit ? 'Update' : 'Create'}
                            </PrimaryButton>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}
