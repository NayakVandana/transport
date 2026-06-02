import FormPage, { FormCard } from '@/Components/FormPage';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import EntityDocumentsSection, {
    uploadDocumentDrafts,
    type DocumentDraft,
} from '@/Components/EntityDocumentsSection';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { usePageHeader } from '@/hooks/usePageHeader';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { apiFieldErrors, hasApiFieldErrors } from '@/lib/apiFormErrors';
import {
    validateVehicleForm,
    type VehicleFormData,
    type VehicleValidationMessages,
} from '@/lib/vehicleValidation';
import type { EntityDocument, ExpenseOption, Vehicle } from '@/types/transport';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, ReactNode, useEffect, useMemo, useState } from 'react';

function dateInputValue(value?: string | null): string {
    return value?.slice(0, 10) ?? '';
}

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

type VehicleShowData = {
    vehicle: Vehicle;
    validationMessages: VehicleValidationMessages;
    fuelTypes: string[];
    document_types: ExpenseOption[];
};

type VehicleMetaData = {
    validationMessages: VehicleValidationMessages;
    fuelTypes: string[];
    document_types: ExpenseOption[];
};

export default function VehicleForm({ vehicleId }: { vehicleId?: number }) {
    const { return_route, return_id, return_label } = useInvoiceReturn();
    const isEdit = Boolean(vehicleId);
    const [validationMessages, setValidationMessages] = useState<VehicleValidationMessages>({});
    const [fuelTypes, setFuelTypes] = useState<string[]>([]);
    const [documentTypes, setDocumentTypes] = useState<ExpenseOption[]>([]);
    const [documents, setDocuments] = useState<EntityDocument[]>([]);
    const [documentDrafts, setDocumentDrafts] = useState<DocumentDraft[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof VehicleFormData, string>>>({});
    const [data, setData] = useState<VehicleFormData>({
        vehicle_number: '',
        vehicle_type: '',
        brand: '',
        model: '',
        capacity: '',
        fuel_type: '',
        insurance_number: '',
        insurance_expiry: '',
        permit_number: '',
        permit_expiry: '',
        pollution_expiry: '',
        fitness_expiry: '',
        status: 'active',
    });

    useEffect(() => {
        setLoading(true);
        setLoadError(null);

        const load = async () => {
            try {
                if (vehicleId) {
                    const res = await appApiPost<ApiEnvelope<VehicleShowData>>(
                        '/vehicles/vehicle-show',
                        { id: vehicleId },
                    );

                    if (!res.success || !res.data?.vehicle) {
                        setLoadError(res.message || 'Could not load vehicle.');
                        return;
                    }

                    const vehicle = res.data.vehicle;
                    setValidationMessages(res.data.validationMessages);
                    setFuelTypes(res.data.fuelTypes);
                    setDocumentTypes(res.data.document_types ?? []);
                    setDocuments(vehicle.documents ?? []);
                    setDocumentDrafts([]);
                    setData({
                        vehicle_number: vehicle.vehicle_number ?? '',
                        vehicle_type: vehicle.vehicle_type ?? '',
                        brand: vehicle.brand ?? '',
                        model: vehicle.model ?? '',
                        capacity: vehicle.capacity ?? '',
                        fuel_type: vehicle.fuel_type ?? '',
                        insurance_number: vehicle.insurance_number ?? '',
                        insurance_expiry: dateInputValue(vehicle.insurance_expiry),
                        permit_number: vehicle.permit_number ?? '',
                        permit_expiry: dateInputValue(vehicle.permit_expiry),
                        pollution_expiry: dateInputValue(vehicle.pollution_expiry),
                        fitness_expiry: dateInputValue(vehicle.fitness_expiry),
                        status: vehicle.status ?? 'active',
                    });
                } else {
                    const res = await appApiPost<ApiEnvelope<VehicleMetaData>>(
                        '/vehicles/vehicle-meta',
                        {},
                    );

                    if (!res.success || !res.data) {
                        setLoadError(res.message || 'Could not load form data.');
                        return;
                    }

                    setValidationMessages(res.data.validationMessages);
                    setFuelTypes(res.data.fuelTypes);
                    setDocumentTypes(res.data.document_types ?? []);
                }
            } catch {
                setLoadError('Could not load form data.');
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [vehicleId, return_route, return_id]);

    const fuelTypeOptions =
        data.fuel_type && !fuelTypes.includes(data.fuel_type)
            ? [data.fuel_type, ...fuelTypes]
            : fuelTypes;

    const setField = <K extends keyof VehicleFormData>(field: K, value: VehicleFormData[K]) => {
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

        const clientErrors = validateVehicleForm(data, validationMessages, fuelTypes);
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            return;
        }

        if (documentDrafts.some((draft) => !draft.file)) {
            setLoadError('Each document row needs a file, or remove empty rows.');
            return;
        }

        setProcessing(true);
        setLoadError(null);

        try {
            const payload: Record<string, unknown> = {
                vehicle_number: data.vehicle_number,
                vehicle_type: data.vehicle_type,
                brand: data.brand,
                model: data.model,
                capacity: data.capacity || null,
                fuel_type: data.fuel_type,
                insurance_number: data.insurance_number,
                insurance_expiry: data.insurance_expiry,
                permit_number: data.permit_number,
                permit_expiry: data.permit_expiry,
                pollution_expiry: data.pollution_expiry,
                fitness_expiry: data.fitness_expiry,
                status: data.status,
                ...(vehicleId ? { id: vehicleId } : {}),
            };

            const res = await appApiPost<ApiEnvelope<{ vehicle: Vehicle }>>(
                vehicleId ? '/vehicles/vehicle-update' : '/vehicles/vehicle-store',
                payload,
            );

            if (!res.success) {
                setErrors(apiFieldErrors(res.data));
                if (!hasApiFieldErrors(res.data)) {
                    setLoadError(res.message || 'Could not save vehicle.');
                }
                return;
            }

            const savedId = res.data?.vehicle?.id;
            if (!savedId) {
                return;
            }

            if (documentDrafts.length > 0) {
                const uploaded = await uploadDocumentDrafts(
                    savedId,
                    'vehicle_id',
                    '/vehicles/vehicle-document-store',
                    documentDrafts,
                );

                if (!uploaded) {
                    setLoadError('Vehicle saved, but some documents failed to upload.');
                    if (!vehicleId) {
                        router.visit(route('vehicles.edit', savedId), { replace: true });
                    }
                    return;
                }
            }

            if (return_route && route().has(return_route)) {
                router.visit(
                    route(
                        return_route,
                        return_id && return_route === 'invoices.edit'
                            ? { invoice: return_id }
                            : {},
                    ),
                );
                return;
            }

            router.visit(route('vehicles.index'));
        } catch {
            setLoadError('Could not save vehicle.');
        } finally {
            setProcessing(false);
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

    usePageHeader(
        <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-800">
                {isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
            </h2>
            <Link href={backHref}>
                <SecondaryButton type="button">
                    {return_label ?? (isEdit ? 'Back to list' : 'Cancel')}
                </SecondaryButton>
            </Link>
        </div>,
    );

    return (
        <>
            <Head title={isEdit ? 'Edit Vehicle' : 'Add Vehicle'} />

            <FormPage size="lg">
                    {loading ? (
                        <p className="py-8 text-center text-sm text-gray-500">Loading…</p>
                    ) : loadError ? (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {loadError}
                        </p>
                    ) : (
                        <FormCard>
                        <form
                            onSubmit={submit}
                            noValidate
                            className="space-y-6"
                        >
                            <div>
                                <h3 className="mb-4 font-medium text-gray-900">Vehicle Details</h3>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <Field label="Vehicle Number" required error={errors.vehicle_number}>
                                        <TextInput
                                            className={inputClass('vehicle_number')}
                                            value={data.vehicle_number}
                                            onChange={(e) =>
                                                setField('vehicle_number', e.target.value.toUpperCase())
                                            }
                                            placeholder="MH04JU9931"
                                        />
                                    </Field>
                                    <Field label="Vehicle Type" required error={errors.vehicle_type}>
                                        <TextInput
                                            className={inputClass('vehicle_type')}
                                            value={data.vehicle_type}
                                            onChange={(e) => setField('vehicle_type', e.target.value)}
                                            placeholder="Truck, Container, etc."
                                        />
                                    </Field>
                                    <Field label="Brand" required error={errors.brand}>
                                        <TextInput
                                            className={inputClass('brand')}
                                            value={data.brand}
                                            onChange={(e) => setField('brand', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Model" required error={errors.model}>
                                        <TextInput
                                            className={inputClass('model')}
                                            value={data.model}
                                            onChange={(e) => setField('model', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Capacity" error={errors.capacity}>
                                        <TextInput
                                            className={inputClass('capacity')}
                                            value={data.capacity}
                                            onChange={(e) => setField('capacity', e.target.value)}
                                            placeholder="e.g. 20T"
                                        />
                                    </Field>
                                    <Field label="Fuel Type" required error={errors.fuel_type}>
                                        <select
                                            className={selectClass('fuel_type')}
                                            value={data.fuel_type}
                                            onChange={(e) => setField('fuel_type', e.target.value)}
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
                                                setField(
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
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <Field
                                        label="Insurance Number"
                                        required
                                        error={errors.insurance_number}
                                    >
                                        <TextInput
                                            className={inputClass('insurance_number')}
                                            value={data.insurance_number}
                                            onChange={(e) =>
                                                setField('insurance_number', e.target.value)
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
                                                setField('insurance_expiry', e.target.value)
                                            }
                                        />
                                    </Field>
                                    <Field label="Permit Number" required error={errors.permit_number}>
                                        <TextInput
                                            className={inputClass('permit_number')}
                                            value={data.permit_number}
                                            onChange={(e) => setField('permit_number', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Permit Expiry" required error={errors.permit_expiry}>
                                        <TextInput
                                            type="date"
                                            className={inputClass('permit_expiry')}
                                            value={data.permit_expiry}
                                            onChange={(e) => setField('permit_expiry', e.target.value)}
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
                                                setField('pollution_expiry', e.target.value)
                                            }
                                        />
                                    </Field>
                                    <Field label="Fitness Expiry" required error={errors.fitness_expiry}>
                                        <TextInput
                                            type="date"
                                            className={inputClass('fitness_expiry')}
                                            value={data.fitness_expiry}
                                            onChange={(e) =>
                                                setField('fitness_expiry', e.target.value)
                                            }
                                        />
                                    </Field>
                                </div>
                            </div>

                            {documentTypes.length > 0 && (
                                <EntityDocumentsSection
                                    documentTypes={documentTypes}
                                    drafts={documentDrafts}
                                    onDraftsChange={setDocumentDrafts}
                                    savedDocuments={documents}
                                />
                            )}

                            <PrimaryButton disabled={processing}>
                                {processing ? 'Saving…' : 'Save'}
                            </PrimaryButton>
                        </form>
                        </FormCard>
                    )}
            </FormPage>
        </>
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
