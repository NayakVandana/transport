import { FormPageHeader } from '@/Components/ListPageHeader';
import LogoUploadField from '@/Components/LogoUploadField';
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
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import EntityDocumentsSection, {
    uploadDocumentDrafts,
    type DocumentDraft,
} from '@/Components/EntityDocumentsSection';
import AddressFormFields from '@/Components/AddressFormFields';
import { invalidateAppQuery } from '@/hooks/useAppQuery';
import { usePageHeader } from '@/hooks/usePageHeader';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import type { EntityDocument, ExpenseOption, Party } from '@/types/transport';
import { apiFieldErrors, fieldInputClass, hasApiFieldErrors } from '@/lib/apiFormErrors';
import {
    emptyPartyForm,
    partyFormPayload,
    partyToFormData,
    validatePartyForm,
    type PartyFormData,
} from '@/lib/partyValidation';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

function useReturnContext() {
    return useMemo(() => {
        const params = new URLSearchParams(window.location.search);

        return params.get('return') === 'profile' ? 'profile' : 'index';
    }, []);
}

export default function PartyForm({ partyId }: { partyId?: number }) {
    const isEdit = Boolean(partyId);
    const returnTo = useReturnContext();
    const backToProfile = isEdit && returnTo === 'profile';

    const backHref = backToProfile
        ? route('parties.profile', partyId!)
        : route('parties.index');

    usePageHeader(
        <FormPageHeader
            title={isEdit ? (backToProfile ? 'Edit Party Profile' : 'Edit Party') : 'New Party'}
            backHref={backHref}
            backLabel={backToProfile ? 'Back to profile' : 'Back to list'}
        />,
        [isEdit, backToProfile, backHref],
    );

    const [loading, setLoading] = useState(Boolean(partyId));
    const [loadError, setLoadError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [documentTypes, setDocumentTypes] = useState<ExpenseOption[]>([]);
    const [documents, setDocuments] = useState<EntityDocument[]>([]);
    const [documentDrafts, setDocumentDrafts] = useState<DocumentDraft[]>([]);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [data, setData] = useState<PartyFormData>(emptyPartyForm());

    useEffect(() => {
        if (partyId) {
            setLoading(true);

            void appApiPost<
                ApiEnvelope<{
                    party: Party;
                    documents: EntityDocument[];
                    document_types: ExpenseOption[];
                }>
            >('/parties/party-show', {
                id: partyId,
            })
                .then((res) => {
                    if (!res.success || !res.data?.party) {
                        setLoadError(res.message || 'Could not load party.');
                        return;
                    }

                    const party = res.data.party;
                    setDocumentTypes(res.data.document_types ?? []);
                    setDocuments(res.data.documents ?? []);
                    setDocumentDrafts([]);
                    setLogoUrl(party.logo_url ?? null);
                    setData(partyToFormData(party));
                })
                .catch(() => {
                    setLoadError('Could not load party.');
                })
                .finally(() => setLoading(false));

            return;
        }

        void appApiPost<ApiEnvelope<{ document_types: ExpenseOption[] }>>(
            '/parties/party-document-meta',
            {},
        )
            .then((res) => {
                if (res.success && res.data) {
                    setDocumentTypes(res.data.document_types ?? []);
                }
            })
            .catch(() => {});
    }, [partyId]);

    const setField = <K extends keyof PartyFormData>(field: K, value: PartyFormData[K]) => {
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

        const clientErrors = validatePartyForm(data);
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
                ...partyFormPayload(data),
                ...(partyId ? { id: partyId } : {}),
            };

            const res = await appApiPost<ApiEnvelope<{ party: Party }>>(
                partyId ? '/parties/party-update' : '/parties/party-store',
                payload,
            );

            if (!res.success) {
                setErrors(apiFieldErrors(res.data));
                if (!hasApiFieldErrors(res.data)) {
                    setLoadError(res.message || 'Could not save party.');
                }
                return;
            }

            const savedId = res.data?.party?.id;
            if (!savedId) {
                return;
            }

            if (documentDrafts.length > 0) {
                const uploaded = await uploadDocumentDrafts(
                    '/parties/party-document-store',
                    documentDrafts,
                    { id: savedId, field: 'party_id' },
                );

                if (!uploaded) {
                    setLoadError('Party saved, but some documents failed to upload.');
                    if (!partyId) {
                        router.visit(route('parties.edit', savedId), { replace: true });
                    }
                    return;
                }
            }

            invalidateAppQuery('parties-list');
            router.visit(
                backToProfile
                    ? route('parties.profile', savedId)
                    : partyId
                      ? route('parties.overview', savedId)
                      : route('parties.index'),
            );
        } catch {
            setLoadError('Could not save party.');
        } finally {
            setProcessing(false);
        }
    };

    const inputClass = (field: keyof PartyFormData) =>
        fieldInputClass(Boolean(errors[field]), formControlClass);

    return (
        <>
            <Head title={isEdit ? (backToProfile ? 'Edit Party Profile' : 'Edit Party') : 'New Party'} />

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
                                <FormGrid>
                                    <FormField width="md">
                                        <InputLabel value="Party Name" />
                                        <TextInput
                                            className={inputClass('name')}
                                            value={data.name}
                                            onChange={(e) => setField('name', e.target.value)}
                                        />
                                        <InputError message={errors.name} className="mt-1" />
                                    </FormField>
                                    <FormField width="md">
                                        <InputLabel value="Party Owner Name" />
                                        <TextInput
                                            className={inputClass('party_owner_name')}
                                            value={data.party_owner_name}
                                            onChange={(e) =>
                                                setField('party_owner_name', e.target.value)
                                            }
                                        />
                                        <InputError
                                            message={errors.party_owner_name}
                                            className="mt-1"
                                        />
                                    </FormField>
                                </FormGrid>

                                {partyId ? (
                                    <LogoUploadField
                                        label="Party logo"
                                        logoUrl={logoUrl}
                                        uploadPath="/parties/party-logo-update"
                                        formFields={{ id: partyId }}
                                        onUpdated={setLogoUrl}
                                    />
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        Save the party first, then upload a logo.
                                    </p>
                                )}
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
                                <FormSectionHeader title="Tax Details" />
                                <FormGrid cols={3}>
                                    <FormField width="md">
                                        <InputLabel value="PAN No" />
                                        <TextInput
                                            className={inputClass('pan_no')}
                                            value={data.pan_no}
                                            onChange={(e) => setField('pan_no', e.target.value)}
                                        />
                                        <InputError message={errors.pan_no} className="mt-1" />
                                    </FormField>
                                    <FormField width="md">
                                        <InputLabel value="GST No" />
                                        <TextInput
                                            className={inputClass('gst_no')}
                                            value={data.gst_no}
                                            onChange={(e) => setField('gst_no', e.target.value)}
                                        />
                                        <InputError message={errors.gst_no} className="mt-1" />
                                    </FormField>
                                    <FormField width="md">
                                        <InputLabel value="International Tax ID" />
                                        <TextInput
                                            className={inputClass('international_tax_id')}
                                            value={data.international_tax_id}
                                            onChange={(e) =>
                                                setField('international_tax_id', e.target.value)
                                            }
                                        />
                                        <InputError
                                            message={errors.international_tax_id}
                                            className="mt-1"
                                        />
                                    </FormField>
                                </FormGrid>
                            </div>

                            <AddressFormFields
                                data={data}
                                errors={errors}
                                onChange={(field, value) => setField(field, value)}
                            />

                            <EntityDocumentsSection
                                documentTypes={documentTypes}
                                drafts={documentDrafts}
                                onDraftsChange={setDocumentDrafts}
                                savedDocuments={documents}
                            />

                            <FormActions>
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Saving…' : isEdit ? 'Save Profile' : 'Create party'}
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
