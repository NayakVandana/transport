import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    validateVehicleForm,
    type VehicleFormData,
    type VehicleValidationMessages,
} from '@/lib/vehicleValidation';
import type { Vehicle } from '@/types/transport';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, ReactNode } from 'react';

function dateInputValue(value?: string | null): string {
    return value?.slice(0, 10) ?? '';
}

interface Props {
    vehicle: Vehicle | null;
    validationMessages: VehicleValidationMessages;
    fuelTypes: string[];
    return_route?: string | null;
    return_id?: number | null;
    return_label?: string | null;
}

export default function VehicleForm({
    vehicle,
    validationMessages,
    fuelTypes,
    return_route,
    return_id,
    return_label,
}: Props) {
    const isEdit = Boolean(vehicle);
    const { data, setData, post, put, processing, errors, clearErrors, setError } = useForm({
        vehicle_number: vehicle?.vehicle_number ?? '',
        vehicle_type: vehicle?.vehicle_type ?? '',
        brand: vehicle?.brand ?? '',
        model: vehicle?.model ?? '',
        capacity: vehicle?.capacity ?? '',
        fuel_type: vehicle?.fuel_type ?? '',
        insurance_number: vehicle?.insurance_number ?? '',
        insurance_expiry: dateInputValue(vehicle?.insurance_expiry),
        permit_number: vehicle?.permit_number ?? '',
        permit_expiry: dateInputValue(vehicle?.permit_expiry),
        pollution_expiry: dateInputValue(vehicle?.pollution_expiry),
        fitness_expiry: dateInputValue(vehicle?.fitness_expiry),
        status: vehicle?.status ?? 'active',
        return_route: return_route ?? '',
        return_id: return_id ?? '',
    });

    const fuelTypeOptions =
        data.fuel_type && !fuelTypes.includes(data.fuel_type)
            ? [data.fuel_type, ...fuelTypes]
            : fuelTypes;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        clearErrors();

        const clientErrors = validateVehicleForm(data, validationMessages, fuelTypes);
        if (Object.keys(clientErrors).length > 0) {
            Object.entries(clientErrors).forEach(([field, message]) => {
                setError(field as keyof VehicleFormData, message);
            });
            return;
        }

        if (isEdit && vehicle) {
            put(route('vehicles.update', vehicle.id));
        } else {
            post(route('vehicles.store'));
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
            : route('vehicles.index');

    const inputClass = (field: keyof VehicleFormData) =>
        `mt-1 block w-full${field === 'vehicle_number' ? ' uppercase' : ''}${
            errors[field] ? ' border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        }`;

    const selectClass = (field: keyof VehicleFormData) =>
        `mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500${
            errors[field] ? ' border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        }`;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
                    </h2>
                    <Link href={backHref}>
                        <SecondaryButton type="button">
                            {return_label ?? (isEdit ? 'Back to list' : 'Cancel')}
                        </SecondaryButton>
                    </Link>
                </div>
            }
        >
            <Head title={isEdit ? 'Edit Vehicle' : 'Add Vehicle'} />

            <div className="py-8">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <form
                        onSubmit={submit}
                        noValidate
                        className="space-y-6 rounded-lg bg-white p-6 shadow"
                    >
                        <div>
                            <h3 className="mb-4 font-medium text-gray-900">Vehicle Details</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Vehicle Number" required error={errors.vehicle_number}>
                                    <TextInput
                                        className={inputClass('vehicle_number')}
                                        value={data.vehicle_number}
                                        onChange={(e) =>
                                            setData('vehicle_number', e.target.value.toUpperCase())
                                        }
                                        placeholder="MH04JU9931"
                                    />
                                </Field>
                                <Field label="Vehicle Type" required error={errors.vehicle_type}>
                                    <TextInput
                                        className={inputClass('vehicle_type')}
                                        value={data.vehicle_type}
                                        onChange={(e) => setData('vehicle_type', e.target.value)}
                                        placeholder="Truck, Container, etc."
                                    />
                                </Field>
                                <Field label="Brand" required error={errors.brand}>
                                    <TextInput
                                        className={inputClass('brand')}
                                        value={data.brand}
                                        onChange={(e) => setData('brand', e.target.value)}
                                    />
                                </Field>
                                <Field label="Model" required error={errors.model}>
                                    <TextInput
                                        className={inputClass('model')}
                                        value={data.model}
                                        onChange={(e) => setData('model', e.target.value)}
                                    />
                                </Field>
                                <Field label="Capacity" error={errors.capacity}>
                                    <TextInput
                                        className={inputClass('capacity')}
                                        value={data.capacity}
                                        onChange={(e) => setData('capacity', e.target.value)}
                                        placeholder="e.g. 20T"
                                    />
                                </Field>
                                <Field label="Fuel Type" required error={errors.fuel_type}>
                                    <select
                                        className={selectClass('fuel_type')}
                                        value={data.fuel_type}
                                        onChange={(e) => setData('fuel_type', e.target.value)}
                                    >
                                        <option value="">Select fuel type</option>
                                        {fuelTypeOptions.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Status" required error={errors.status}>
                                    <select
                                        className={selectClass('status')}
                                        value={data.status}
                                        onChange={(e) =>
                                            setData(
                                                'status',
                                                e.target.value as 'active' | 'inactive',
                                            )
                                        }
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </Field>
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-4 font-medium text-gray-900">
                                Insurance & Permits
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label="Insurance Number"
                                    required
                                    error={errors.insurance_number}
                                >
                                    <TextInput
                                        className={inputClass('insurance_number')}
                                        value={data.insurance_number}
                                        onChange={(e) =>
                                            setData('insurance_number', e.target.value)
                                        }
                                    />
                                </Field>
                                <Field
                                    label="Insurance Expiry"
                                    required
                                    error={errors.insurance_expiry}
                                >
                                    <TextInput
                                        type="date"
                                        className={inputClass('insurance_expiry')}
                                        value={data.insurance_expiry}
                                        onChange={(e) =>
                                            setData('insurance_expiry', e.target.value)
                                        }
                                    />
                                </Field>
                                <Field label="Permit Number" required error={errors.permit_number}>
                                    <TextInput
                                        className={inputClass('permit_number')}
                                        value={data.permit_number}
                                        onChange={(e) => setData('permit_number', e.target.value)}
                                    />
                                </Field>
                                <Field label="Permit Expiry" required error={errors.permit_expiry}>
                                    <TextInput
                                        type="date"
                                        className={inputClass('permit_expiry')}
                                        value={data.permit_expiry}
                                        onChange={(e) => setData('permit_expiry', e.target.value)}
                                    />
                                </Field>
                                <Field
                                    label="Pollution Expiry"
                                    required
                                    error={errors.pollution_expiry}
                                >
                                    <TextInput
                                        type="date"
                                        className={inputClass('pollution_expiry')}
                                        value={data.pollution_expiry}
                                        onChange={(e) =>
                                            setData('pollution_expiry', e.target.value)
                                        }
                                    />
                                </Field>
                                <Field label="Fitness Expiry" required error={errors.fitness_expiry}>
                                    <TextInput
                                        type="date"
                                        className={inputClass('fitness_expiry')}
                                        value={data.fitness_expiry}
                                        onChange={(e) =>
                                            setData('fitness_expiry', e.target.value)
                                        }
                                    />
                                </Field>
                            </div>
                        </div>

                        <PrimaryButton disabled={processing}>
                            {isEdit ? 'Update Vehicle' : 'Add Vehicle'}
                        </PrimaryButton>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Field({
    label,
    required = false,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div>
            <InputLabel>
                {label}
                {required && <span className="text-red-600"> *</span>}
            </InputLabel>
            {children}
            <InputError message={error} className="mt-1" />
        </div>
    );
}
