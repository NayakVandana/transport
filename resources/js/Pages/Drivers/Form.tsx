import AddressFormFields from '@/Components/AddressFormFields';
import PhotoUploadField from '@/Components/PhotoUploadField';
import { FormPageHeader } from '@/Components/ListPageHeader';
import FormPage, {
    FormActions,
    FormCard,
    FormField,
    FormGrid,
    FormSectionHeader,
    formControlClass,
} from '@/Components/FormPage';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import EntityDocumentsSection, {
    uploadDocumentDrafts,
    type DocumentDraft,
} from '@/Components/EntityDocumentsSection';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { invalidateAppQuery } from '@/hooks/useAppQuery';
import { usePageHeader } from '@/hooks/usePageHeader';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import type { Driver, EntityDocument, ExpenseOption } from '@/types/transport';
import { apiFieldErrors, fieldInputClass, hasApiFieldErrors } from '@/lib/apiFormErrors';
import {
    driverFormPayload,
    driverToFormData,
    emptyDriverForm,
    validateDriverForm,
    type DriverFormData,
} from '@/lib/driverValidation';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

function useReturnContext() {
    return useMemo(() => {
        const params = new URLSearchParams(window.location.search);

        return params.get('return') === 'profile' ? 'profile' : 'index';
    }, []);
}

export default function DriverForm({ driverId }: { driverId?: number }) {
    const isEdit = Boolean(driverId);
    const returnTo = useReturnContext();
    const backToProfile = isEdit && returnTo === 'profile';
    const backHref = backToProfile
        ? route('drivers.show', driverId!)
        : route('drivers.index');

    usePageHeader(
        <FormPageHeader
            title={isEdit ? (backToProfile ? 'Edit Driver Profile' : 'Edit Driver') : 'New Driver'}
            backHref={backHref}
            backLabel={backToProfile ? 'Back to profile' : 'Back to list'}
        />,
        [isEdit, backToProfile, backHref],
    );

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [documentTypes, setDocumentTypes] = useState<ExpenseOption[]>([]);
    const [documents, setDocuments] = useState<EntityDocument[]>([]);
    const [documentDrafts, setDocumentDrafts] = useState<DocumentDraft[]>([]);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [data, setData] = useState<DriverFormData>(emptyDriverForm());

    useEffect(() => {
        setLoading(true);
        setLoadError(null);

        const load = async () => {
            try {
                if (driverId) {
                    const res = await appApiPost<
                        ApiEnvelope<{ driver: Driver; document_types: ExpenseOption[] }>
                    >('/drivers/driver-show', { id: driverId });

                    if (!res.success || !res.data?.driver) {
                        setLoadError(res.message || 'Could not load driver.');
                        return;
                    }

                    const driver = res.data.driver;
                    setDocumentTypes(res.data.document_types ?? []);
                    setDocuments(driver.documents ?? []);
                    setDocumentDrafts([]);
                    setPhotoUrl(driver.photo_url ?? null);
                    setData(driverToFormData(driver));
                } else {
                    const res = await appApiPost<
                        ApiEnvelope<{ document_types: ExpenseOption[] }>
                    >('/drivers/driver-meta', {});

                    if (!res.success || !res.data) {
                        setLoadError(res.message || 'Could not load form data.');
                        return;
                    }

                    setDocumentTypes(res.data.document_types ?? []);
                }
            } catch {
                setLoadError('Could not load form data.');
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [driverId]);

    const setField = <K extends keyof DriverFormData>(field: K, value: DriverFormData[K]) => {
        setData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const setMobile = (index: number, value: string) => {
        setData((prev) => {
            const mobiles = [...prev.mobiles];
            mobiles[index] = value;
            return { ...prev, mobiles };
        });
        setErrors((prev) => {
            const next = { ...prev };
            delete next[`mobiles.${index}`];
            return next;
        });
    };

    const addMobile = () => {
        setData((prev) => ({ ...prev, mobiles: [...prev.mobiles, ''] }));
    };

    const removeMobile = (index: number) => {
        setData((prev) => ({
            ...prev,
            mobiles:
                prev.mobiles.length <= 1
                    ? ['']
                    : prev.mobiles.filter((_, mobileIndex) => mobileIndex !== index),
        }));
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoadError(null);

        const clientErrors = validateDriverForm(data);
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors as Record<string, string>);
            return;
        }

        if (documentDrafts.some((draft) => !draft.file)) {
            setLoadError('Each document row needs a file, or remove empty rows.');
            return;
        }

        setProcessing(true);

        try {
            const payload = {
                ...driverFormPayload(data),
                name: data.name.trim(),
                salary: data.salary.trim() === '' ? null : Number(data.salary),
                status: data.status,
                ...(driverId ? { id: driverId } : {}),
            };

            const res = await appApiPost<ApiEnvelope<{ driver: Driver }>>(
                driverId ? '/drivers/driver-update' : '/drivers/driver-store',
                payload,
            );

            if (!res.success) {
                setErrors(apiFieldErrors(res.data));
                if (!hasApiFieldErrors(res.data)) {
                    setLoadError(res.message || 'Could not save driver.');
                }
                return;
            }

            invalidateAppQuery('drivers-list');

            const savedId = res.data?.driver?.id;
            if (!savedId) {
                return;
            }

            if (documentDrafts.length > 0) {
                const uploaded = await uploadDocumentDrafts(
                    '/drivers/driver-document-store',
                    documentDrafts,
                    { id: savedId, field: 'driver_id' },
                );

                if (!uploaded) {
                    setLoadError('Driver saved, but some documents failed to upload.');
                    if (!driverId) {
                        router.visit(route('drivers.edit', savedId), { replace: true });
                    }
                    return;
                }
            }

            router.visit(
                backToProfile
                    ? route('drivers.show', savedId)
                    : route('drivers.index'),
            );
        } catch {
            setLoadError('Could not save driver.');
        } finally {
            setProcessing(false);
        }
    };

    const inputClass = (field: keyof DriverFormData) =>
        fieldInputClass(Boolean(errors[field]), formControlClass);

    return (
        <>
            <Head title={isEdit ? (backToProfile ? 'Edit Driver Profile' : 'Edit Driver') : 'New Driver'} />

            <FormPage size="md">
                {loading ? (
                    <p className="py-8 text-center text-sm text-gray-500">Loading…</p>
                ) : loadError && !data.name ? (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {loadError}
                    </p>
                ) : (
                    <FormCard>
                        {loadError && (
                            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                                {loadError}
                            </p>
                        )}

                        <form onSubmit={submit} className="space-y-6">
                            <div className="space-y-5">
                                <FormSectionHeader title="Basic Details" />
                                <FormField width="md">
                                    <InputLabel value="Name" />
                                    <TextInput
                                        className={inputClass('name')}
                                        value={data.name}
                                        onChange={(e) => setField('name', e.target.value)}
                                    />
                                    <InputError message={errors.name} className="mt-1" />
                                </FormField>

                                {driverId ? (
                                    <PhotoUploadField
                                        label="Driver photo"
                                        photoUrl={photoUrl}
                                        uploadPath="/drivers/driver-photo-update"
                                        formFields={{ id: driverId }}
                                        onUpdated={setPhotoUrl}
                                    />
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        Save the driver first, then upload a photo.
                                    </p>
                                )}

                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                        checked={data.show_photo}
                                        onChange={(e) => setField('show_photo', e.target.checked)}
                                    />
                                    Show photo on driver profile
                                </label>
                            </div>

                            <div className="space-y-5">
                                <FormSectionHeader title="Contact Details" />
                                <FormField width="md">
                                    <InputLabel value="Email" />
                                    <TextInput
                                        type="email"
                                        className={inputClass('email')}
                                        value={data.email}
                                        onChange={(e) => setField('email', e.target.value)}
                                    />
                                    <InputError message={errors.email} className="mt-1" />
                                </FormField>

                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                        checked={data.show_email}
                                        onChange={(e) => setField('show_email', e.target.checked)}
                                    />
                                    Show email on driver profile
                                </label>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <InputLabel value="Mobile Numbers" />
                                        <button
                                            type="button"
                                            onClick={addMobile}
                                            className="text-sm text-indigo-600 hover:underline"
                                        >
                                            + Add mobile
                                        </button>
                                    </div>
                                    {data.mobiles.map((mobile, index) => (
                                        <div key={index} className="flex items-start gap-2">
                                            <div className="min-w-0 flex-1">
                                                <TextInput
                                                    className={fieldInputClass(
                                                        Boolean(errors[`mobiles.${index}`]),
                                                        formControlClass,
                                                    )}
                                                    value={mobile}
                                                    onChange={(e) => setMobile(index, e.target.value)}
                                                    placeholder="Mobile number"
                                                />
                                                <InputError
                                                    message={errors[`mobiles.${index}`]}
                                                    className="mt-1"
                                                />
                                            </div>
                                            {data.mobiles.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeMobile(index)}
                                                    className="mt-2 text-sm text-red-600 hover:underline"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-5">
                                <FormSectionHeader title="Identity Details" />
                                <FormGrid cols={2}>
                                    <FormField width="md">
                                        <InputLabel value="Aadhaar No" />
                                        <TextInput
                                            className={inputClass('aadhaar_no')}
                                            value={data.aadhaar_no}
                                            onChange={(e) => setField('aadhaar_no', e.target.value)}
                                            inputMode="numeric"
                                            maxLength={12}
                                        />
                                        <InputError message={errors.aadhaar_no} className="mt-1" />
                                    </FormField>
                                    <FormField width="md">
                                        <InputLabel value="PAN No" />
                                        <TextInput
                                            className={inputClass('pan_no')}
                                            value={data.pan_no}
                                            onChange={(e) => setField('pan_no', e.target.value)}
                                        />
                                        <InputError message={errors.pan_no} className="mt-1" />
                                    </FormField>
                                </FormGrid>
                            </div>

                            <div className="space-y-5">
                                <FormSectionHeader title="Employment Details" />
                                <FormGrid>
                                    <FormField width="md">
                                        <InputLabel value="License Number" />
                                        <TextInput
                                            className={inputClass('license_number')}
                                            value={data.license_number}
                                            onChange={(e) => setField('license_number', e.target.value)}
                                        />
                                        <InputError message={errors.license_number} className="mt-1" />
                                    </FormField>
                                    <FormField width="md">
                                        <InputLabel value="License Expiry" />
                                        <TextInput
                                            type="date"
                                            className={inputClass('license_expiry')}
                                            value={data.license_expiry}
                                            onChange={(e) => setField('license_expiry', e.target.value)}
                                        />
                                        <InputError message={errors.license_expiry} className="mt-1" />
                                    </FormField>
                                </FormGrid>
                                <FormGrid>
                                    <FormField width="md">
                                        <InputLabel value="Joining Date" />
                                        <TextInput
                                            type="date"
                                            className={inputClass('joining_date')}
                                            value={data.joining_date}
                                            onChange={(e) => setField('joining_date', e.target.value)}
                                        />
                                        <InputError message={errors.joining_date} className="mt-1" />
                                    </FormField>
                                    <FormField width="md">
                                        <InputLabel value="Salary (₹)" />
                                        <TextInput
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className={inputClass('salary')}
                                            value={data.salary}
                                            onChange={(e) => setField('salary', e.target.value)}
                                            placeholder="0.00"
                                        />
                                        <InputError message={errors.salary} className="mt-1" />
                                    </FormField>
                                </FormGrid>
                                <FormField width="sm">
                                    <InputLabel value="Status" />
                                    <select
                                        className={fieldInputClass(
                                            Boolean(errors.status),
                                            formControlClass,
                                        )}
                                        value={data.status}
                                        onChange={(e) =>
                                            setField('status', e.target.value as 'active' | 'inactive')
                                        }
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    <InputError message={errors.status} className="mt-1" />
                                </FormField>
                            </div>

                            <AddressFormFields
                                data={data}
                                errors={errors}
                                onChange={(field, value) => setField(field, value)}
                            />

                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                    checked={data.show_address}
                                    onChange={(e) => setField('show_address', e.target.checked)}
                                />
                                Show address on driver profile
                            </label>

                            {documentTypes.length > 0 && (
                                <EntityDocumentsSection
                                    documentTypes={documentTypes}
                                    drafts={documentDrafts}
                                    onDraftsChange={setDocumentDrafts}
                                    savedDocuments={documents}
                                />
                            )}

                            <FormActions>
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Saving…' : 'Save'}
                                </PrimaryButton>
                                <Link href={backHref}>
                                    <SecondaryButton type="button">Cancel</SecondaryButton>
                                </Link>
                            </FormActions>
                        </form>
                    </FormCard>
                )}
            </FormPage>
        </>
    );
}
