import { FormPageHeader } from '@/Components/ListPageHeader';
import FormPage, { FormActions, FormCard, FormField, formControlClass } from '@/Components/FormPage';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { usePageHeader } from '@/hooks/usePageHeader';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { apiFieldErrors, fieldInputClass, hasApiFieldErrors } from '@/lib/apiFormErrors';
import { resolveReturnHref } from '@/lib/invoiceReturn';
import { locationFormPayload, normalizeLocationName, validateLocationForm } from '@/lib/locationValidation';
import type { Location } from '@/types/transport';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';

function useReturnContext() {
    return useMemo(() => {
        const params = new URLSearchParams(window.location.search);

        return {
            return_route: params.get('return_route'),
            return_id: params.get('return_id') ? Number(params.get('return_id')) : null,
            return_label: params.get('return_label'),
        };
    }, []);
}

export default function LocationForm() {
    const { return_route, return_id, return_label } = useReturnContext();
    const [name, setName] = useState('');
    const [processing, setProcessing] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const backHref = resolveReturnHref(return_route, return_id) ?? route('locations.index');

    const backLabel =
        return_label ??
        (return_route?.startsWith('entrybooks.')
            ? 'Back to entry'
            : return_route?.startsWith('invoices.')
              ? 'Back to invoice'
              : 'Back to list');

    usePageHeader(
        <FormPageHeader title="Add Location" backHref={backHref} backLabel={backLabel} />,
        [backHref, backLabel],
    );

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoadError(null);

        const clientErrors = validateLocationForm({ name });
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            return;
        }

        setProcessing(true);

        try {
            const payload = locationFormPayload({ name });
            const res = await appApiPost<ApiEnvelope<{ location: Location }>>(
                '/locations/location-store',
                payload,
            );

            if (!res.success) {
                setErrors(apiFieldErrors(res.data));
                if (!hasApiFieldErrors(res.data)) {
                    setLoadError(res.message || 'Could not add location.');
                }
                return;
            }

            const redirect = resolveReturnHref(return_route, return_id);
            if (redirect) {
                router.visit(redirect);
                return;
            }

            router.visit(route('locations.index'));
        } catch {
            setLoadError('Could not add location.');
        } finally {
            setProcessing(false);
        }
    };

    const inputClass = fieldInputClass(Boolean(errors.name), formControlClass);

    return (
        <>
            <Head title="Add Location" />

            <FormPage size="sm">
                {loadError && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {loadError}
                    </p>
                )}

                <FormCard>
                    <p className="mb-4 text-sm text-gray-600">
                        Location names are used in route from/to fields across entrybooks and
                        invoices.
                    </p>

                    <form onSubmit={submit} className="space-y-5">
                        <FormField width="lg">
                            <InputLabel value="Location Name" />
                            <TextInput
                                className={inputClass}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onBlur={() => setName((current) => normalizeLocationName(current))}
                                placeholder="SILVASSA"
                                autoFocus
                            />
                            <InputError message={errors.name} className="mt-1" />
                        </FormField>

                        <FormActions>
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Saving…' : 'Save Location'}
                            </PrimaryButton>
                            <Link href={backHref}>
                                <SecondaryButton type="button">Cancel</SecondaryButton>
                            </Link>
                        </FormActions>
                    </form>
                </FormCard>
            </FormPage>
        </>
    );
}
