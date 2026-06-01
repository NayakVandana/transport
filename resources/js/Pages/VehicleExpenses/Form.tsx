import PageContainer from '@/Components/PageContainer';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { usePageHeader } from '@/hooks/usePageHeader';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { apiFieldErrors, hasApiFieldErrors } from '@/lib/apiFormErrors';
import {
    validateVehicleExpenseForm,
    type VehicleExpenseFormData,
    type VehicleExpenseValidationMessages,
} from '@/lib/vehicleExpenseValidation';
import { calculateVehicleExpenseBalance, formatMoney } from '@/lib/freightCalculator';
import type { Vehicle, VehicleExpense } from '@/types/transport';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

function dateInputValue(value?: string | null): string {
    return value?.slice(0, 10) ?? '';
}

type VehicleExpenseShowData = {
    vehicleExpense: VehicleExpense;
    vehicles: Pick<Vehicle, 'id' | 'vehicle_number'>[];
    validationMessages: VehicleExpenseValidationMessages;
};

type VehicleExpenseMetaData = {
    vehicles: Pick<Vehicle, 'id' | 'vehicle_number'>[];
    validationMessages: VehicleExpenseValidationMessages;
};

export default function VehicleExpenseForm({ vehicleExpenseId }: { vehicleExpenseId?: number }) {
    const isEdit = Boolean(vehicleExpenseId);

    usePageHeader(
        <h2 className="text-xl font-semibold text-gray-800">
            {isEdit ? 'Edit Vehicle Expense' : 'Add Vehicle Expense'}
        </h2>,
    );

    const [vehicles, setVehicles] = useState<Pick<Vehicle, 'id' | 'vehicle_number'>[]>([]);
    const [validationMessages, setValidationMessages] = useState<VehicleExpenseValidationMessages>({});
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof VehicleExpenseFormData, string>>>({});
    const [data, setData] = useState<VehicleExpenseFormData>({
        expense_date: new Date().toISOString().slice(0, 10),
        vehicle_id: '',
        freight: '',
        advance: '0',
        empty_charge: '0',
        toll: '0',
        maintenance: '0',
    });

    useEffect(() => {
        setLoading(true);
        setLoadError(null);

        const load = async () => {
            try {
                if (vehicleExpenseId) {
                    const res = await appApiPost<ApiEnvelope<VehicleExpenseShowData>>(
                        '/vehicle-expenses/vehicle-expense-show',
                        { id: vehicleExpenseId },
                    );

                    if (!res.success || !res.data?.vehicleExpense) {
                        setLoadError(res.message || 'Could not load vehicle expense.');
                        return;
                    }

                    const row = res.data.vehicleExpense;
                    setVehicles(res.data.vehicles);
                    setValidationMessages(res.data.validationMessages);
                    setData({
                        expense_date: dateInputValue(row.expense_date),
                        vehicle_id: row.vehicle_id ? String(row.vehicle_id) : '',
                        freight: row.freight != null ? String(row.freight) : '',
                        advance: row.advance != null ? String(row.advance) : '0',
                        empty_charge: row.empty_charge != null ? String(row.empty_charge) : '0',
                        toll: row.toll != null ? String(row.toll) : '0',
                        maintenance: row.maintenance != null ? String(row.maintenance) : '0',
                    });
                } else {
                    const res = await appApiPost<ApiEnvelope<VehicleExpenseMetaData>>(
                        '/vehicle-expenses/vehicle-expense-meta',
                        {},
                    );

                    if (!res.success || !res.data) {
                        setLoadError(res.message || 'Could not load form data.');
                        return;
                    }

                    setVehicles(res.data.vehicles);
                    setValidationMessages(res.data.validationMessages);
                }
            } catch {
                setLoadError('Could not load form data.');
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [vehicleExpenseId]);

    const balance = useMemo(
        () =>
            calculateVehicleExpenseBalance(
                data.freight,
                data.advance,
                data.empty_charge,
                data.toll,
                data.maintenance,
            ),
        [data.freight, data.advance, data.empty_charge, data.toll, data.maintenance],
    );

    const setField = (field: keyof VehicleExpenseFormData, value: string) => {
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

        const clientErrors = validateVehicleExpenseForm(data, validationMessages);
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            return;
        }

        setProcessing(true);

        try {
            const payload = {
                ...data,
                vehicle_id: Number(data.vehicle_id),
                freight: Number(data.freight),
                advance: Number(data.advance),
                empty_charge: Number(data.empty_charge),
                toll: Number(data.toll),
                maintenance: Number(data.maintenance),
                ...(vehicleExpenseId ? { id: vehicleExpenseId } : {}),
            };

            const res = await appApiPost<ApiEnvelope<{ vehicleExpense: VehicleExpense }>>(
                vehicleExpenseId
                    ? '/vehicle-expenses/vehicle-expense-update'
                    : '/vehicle-expenses/vehicle-expense-store',
                payload,
            );

            if (!res.success) {
                setErrors(apiFieldErrors(res.data));
                if (!hasApiFieldErrors(res.data)) {
                    setLoadError(res.message || 'Could not save vehicle expense.');
                }
                return;
            }

            router.visit(route('vehicle-expenses.index'));
        } catch {
            setLoadError('Could not save vehicle expense.');
        } finally {
            setProcessing(false);
        }
    };

    const inputClass = (field: keyof VehicleExpenseFormData) =>
        `mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
            errors[field] ? 'border-red-300' : ''
        }`;

    if (loading) {
        return (
            <>
                <Head title={isEdit ? 'Edit Vehicle Expense' : 'Add Vehicle Expense'} />
                <p className="py-8 text-center text-sm text-gray-500">Loading…</p>
            </>
        );
    }

    return (
        <>
            <Head title={isEdit ? 'Edit Vehicle Expense' : 'Add Vehicle Expense'} />

            <PageContainer width="2xl">
                    {loadError && (
                        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {loadError}
                        </p>
                    )}

                    <form onSubmit={submit} className="space-y-5 rounded-lg bg-white p-6 shadow">
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <InputLabel value="Date" />
                                <TextInput
                                    type="date"
                                    className={inputClass('expense_date')}
                                    value={data.expense_date}
                                    onChange={(e) => setField('expense_date', e.target.value)}
                                    required
                                />
                                <InputError message={errors.expense_date} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Vehicle" />
                                <select
                                    className={inputClass('vehicle_id')}
                                    value={data.vehicle_id}
                                    onChange={(e) => setField('vehicle_id', e.target.value)}
                                    required
                                >
                                    <option value="">Select vehicle</option>
                                    {vehicles.map((vehicle) => (
                                        <option key={vehicle.id} value={vehicle.id}>
                                            {vehicle.vehicle_number}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.vehicle_id} className="mt-1" />
                            </div>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <InputLabel value="Freight" />
                                <TextInput
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className={inputClass('freight')}
                                    value={data.freight}
                                    onChange={(e) => setField('freight', e.target.value)}
                                    required
                                />
                                <InputError message={errors.freight} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Advance" />
                                <TextInput
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className={inputClass('advance')}
                                    value={data.advance}
                                    onChange={(e) => setField('advance', e.target.value)}
                                />
                                <InputError message={errors.advance} className="mt-1" />
                            </div>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-3">
                            <div>
                                <InputLabel value="Empty" />
                                <TextInput
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className={inputClass('empty_charge')}
                                    value={data.empty_charge}
                                    onChange={(e) => setField('empty_charge', e.target.value)}
                                />
                                <InputError message={errors.empty_charge} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Toll" />
                                <TextInput
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className={inputClass('toll')}
                                    value={data.toll}
                                    onChange={(e) => setField('toll', e.target.value)}
                                />
                                <InputError message={errors.toll} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Maintenance" />
                                <TextInput
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className={inputClass('maintenance')}
                                    value={data.maintenance}
                                    onChange={(e) => setField('maintenance', e.target.value)}
                                />
                                <InputError message={errors.maintenance} className="mt-1" />
                            </div>
                        </div>

                        <div>
                            <InputLabel value="Balance" />
                            <p className="mt-2 text-lg font-semibold text-gray-900">
                                ₹ {formatMoney(balance)}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                Freight + Empty − Advance − Toll − Maintenance
                            </p>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <PrimaryButton disabled={processing}>
                                {isEdit ? 'Update Expense' : 'Save Expense'}
                            </PrimaryButton>
                            <Link
                                href={route('vehicle-expenses.index')}
                                className="text-sm text-gray-600 hover:text-gray-900"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
            </PageContainer>
        </>
    );
}
