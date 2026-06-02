import FormPage, {
    FormActions,
    FormCard,
    FormField,
    FormGrid,
    formControlClass,
} from '@/Components/FormPage';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { invalidateAppQuery } from '@/hooks/useAppQuery';
import { usePageHeader } from '@/hooks/usePageHeader';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import type { Party } from '@/types/transport';
import { apiFieldErrors, fieldInputClass, hasApiFieldErrors } from '@/lib/apiFormErrors';
import { validatePartyForm } from '@/lib/partyValidation';
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
        <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-800">
                {isEdit ? (backToProfile ? 'Edit Party Profile' : 'Edit Party') : 'New Party'}
            </h2>
            <Link href={backHref}>
                <SecondaryButton type="button">
                    {backToProfile ? 'Back to profile' : 'Back to list'}
                </SecondaryButton>
            </Link>
        </div>,
    );

    const [loading, setLoading] = useState(Boolean(partyId));
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
        if (!partyId) {
            return;
        }

        setLoading(true);

        void appApiPost<ApiEnvelope<{ party: Party }>>('/parties/party-show', {
            id: partyId,
        })
            .then((res) => {
                if (!res.success || !res.data?.party) {
                    setLoadError(res.message || 'Could not load party.');
                    return;
                }

                const party = res.data.party;
                setData({
                    name: party.name ?? '',
                    mobile: party.mobile ?? '',
                    address: party.address ?? '',
                    state_code: party.state_code ?? '',
                });
            })
            .catch(() => {
                setLoadError('Could not load party.');
            })
            .finally(() => setLoading(false));
    }, [partyId]);

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
        setLoadError(null);

        const clientErrors = validatePartyForm(data);
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            return;
        }

        setProcessing(true);

        try {
            const payload = {
                ...data,
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

            invalidateAppQuery('parties-list');
            router.visit(
                backToProfile ? route('parties.profile', partyId!) : route('parties.index'),
            );
        } catch {
            setLoadError('Could not save party.');
        } finally {
            setProcessing(false);
        }
    };

    const inputClass = (field: keyof typeof data) =>
        fieldInputClass(Boolean(errors[field]), formControlClass);

    return (
        <>
            <Head title={isEdit ? (backToProfile ? 'Edit Party Profile' : 'Edit Party') : 'New Party'} />

            <FormPage size="sm">
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

                        <form onSubmit={submit} className="space-y-5">
                            <FormGrid>
                                <FormField width="md">
                                    <InputLabel value="Name" />
                                    <TextInput
                                        className={inputClass('name')}
                                        value={data.name}
                                        onChange={(e) => setField('name', e.target.value)}
                                    />
                                    <InputError message={errors.name} className="mt-1" />
                                </FormField>
                                <FormField width="md">
                                    <InputLabel value="Mobile" />
                                    <TextInput
                                        className={inputClass('mobile')}
                                        value={data.mobile}
                                        onChange={(e) => setField('mobile', e.target.value)}
                                    />
                                    <InputError message={errors.mobile} className="mt-1" />
                                </FormField>
                            </FormGrid>

                            <FormField width="full">
                                <InputLabel value="Address" />
                                <textarea
                                    className={`${inputClass('address')} rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
                                    rows={4}
                                    value={data.address}
                                    onChange={(e) => setField('address', e.target.value)}
                                />
                                <InputError message={errors.address} className="mt-1" />
                            </FormField>

                            <FormField width="sm">
                                <InputLabel value="State code" />
                                <TextInput
                                    className={inputClass('state_code')}
                                    value={data.state_code}
                                    onChange={(e) => setField('state_code', e.target.value)}
                                    placeholder="e.g. 27"
                                />
                                <InputError message={errors.state_code} className="mt-1" />
                            </FormField>

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
