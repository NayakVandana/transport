import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { invalidateAppQuery } from '@/hooks/useAppQuery';
import { usePageHeader } from '@/hooks/usePageHeader';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import type { Driver } from '@/types/transport';
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

function dateInputValue(value?: string | null): string {
    return value?.slice(0, 10) ?? '';
}

export default function DriverForm({ driverId }: { driverId?: number }) {
    const isEdit = Boolean(driverId);

    usePageHeader(
        <h2 className="text-xl font-semibold text-gray-800">
            {isEdit ? 'Edit Driver' : 'New Driver'}
        </h2>,
    );

    const [loading, setLoading] = useState(Boolean(driverId));
    const [loadError, setLoadError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [data, setData] = useState({
        name: '',
        mobile: '',
        license_number: '',
        license_expiry: '',
        joining_date: '',
        salary: '',
        address: '',
        status: 'active' as 'active' | 'inactive',
    });

    useEffect(() => {
        if (!driverId) {
            return;
        }

        setLoading(true);

        void appApiPost<ApiEnvelope<{ driver: Driver }>>('/drivers/driver-show', {
            id: driverId,
        })
            .then((res) => {
                if (!res.success || !res.data?.driver) {
                    setLoadError(res.message || 'Could not load driver.');
                    return;
                }

                const driver = res.data.driver;
                setData({
                    name: driver.name ?? '',
                    mobile: driver.mobile ?? '',
                    license_number: driver.license_number ?? '',
                    license_expiry: dateInputValue(driver.license_expiry),
                    joining_date: dateInputValue(driver.joining_date),
                    salary: driver.salary != null ? String(driver.salary) : '',
                    address: driver.address ?? '',
                    status: driver.status ?? 'active',
                });
            })
            .catch(() => {
                setLoadError('Could not load driver.');
            })
            .finally(() => setLoading(false));
    }, [driverId]);

    const setField = <K extends keyof typeof data>(field: K, value: (typeof data)[K]) => {
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
                salary: data.salary.trim() === '' ? null : Number(data.salary),
                ...(driverId ? { id: driverId } : {}),
            };

            const res = await appApiPost<ApiEnvelope<{ driver: Driver }>>(
                driverId ? '/drivers/driver-update' : '/drivers/driver-store',
                payload,
            );

            if (!res.success) {
                setErrors(apiFieldErrors(res.data));
                if (!res.data) {
                    setLoadError(res.message || 'Could not save driver.');
                }
                return;
            }

            invalidateAppQuery('drivers-list');
            router.visit(route('drivers.index'));
        } catch {
            setLoadError('Could not save driver.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <Head title={isEdit ? 'Edit Driver' : 'New Driver'} />

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
                                <InputLabel value="License Number" />
                                <TextInput
                                    className="mt-1 block w-full"
                                    value={data.license_number}
                                    onChange={(e) => setField('license_number', e.target.value)}
                                />
                                <InputError message={errors.license_number} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value="License Expiry" />
                                <TextInput
                                    type="date"
                                    className="mt-1 block w-full"
                                    value={data.license_expiry}
                                    onChange={(e) => setField('license_expiry', e.target.value)}
                                />
                                <InputError message={errors.license_expiry} className="mt-1" />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <InputLabel value="Joining Date" />
                                    <TextInput
                                        type="date"
                                        className="mt-1 block w-full"
                                        value={data.joining_date}
                                        onChange={(e) => setField('joining_date', e.target.value)}
                                    />
                                    <InputError message={errors.joining_date} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel value="Salary (₹)" />
                                    <TextInput
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="mt-1 block w-full"
                                        value={data.salary}
                                        onChange={(e) => setField('salary', e.target.value)}
                                        placeholder="0.00"
                                    />
                                    <InputError message={errors.salary} className="mt-1" />
                                </div>
                            </div>
                            <div>
                                <InputLabel value="Address" />
                                <textarea
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows={3}
                                    value={data.address}
                                    onChange={(e) => setField('address', e.target.value)}
                                />
                                <InputError message={errors.address} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value="Status" />
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.status}
                                    onChange={(e) =>
                                        setField('status', e.target.value as 'active' | 'inactive')
                                    }
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                <InputError message={errors.status} className="mt-1" />
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
