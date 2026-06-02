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
import { validateRouteForm } from '@/lib/routeValidation';
import type { RouteLocation } from '@/types/transport';
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

export default function RouteForm() {
    const { return_route, return_id, return_label } = useReturnContext();
    const [name, setName] = useState('');
    const [processing, setProcessing] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const backHref = resolveReturnHref(return_route, return_id) ?? route('routes.index');

    const backLabel =
        return_label ??
        (return_route?.startsWith('entrybooks.')
            ? 'Back to entry'
            : return_route?.startsWith('invoices.')
              ? 'Back to invoice'
              : 'Back to list');

    usePageHeader(
        <FormPageHeader title="Add Route" backHref={backHref} backLabel={backLabel} />,
        [backHref, backLabel],
    );

    const setRouteName = (value: string) => {
        setName(value);
        setErrors((prev) => {
            if (!prev.name) {
                return prev;
            }
            const next = { ...prev };
            delete next.name;
            return next;
        });
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoadError(null);

        const clientErrors = validateRouteForm({ name });
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            return;
        }

        setProcessing(true);

        try {
            const res = await appApiPost<ApiEnvelope<{ route: RouteLocation }>>(
                '/routes/route-store',
                { name: name.trim() },
            );

            if (!res.success) {
                setErrors(apiFieldErrors(res.data));
                if (!hasApiFieldErrors(res.data)) {
                    setLoadError(res.message || 'Could not add route.');
                }
                return;
            }

            const redirect = resolveReturnHref(return_route, return_id);
            if (redirect) {
                router.visit(redirect);
                return;
            }

            router.visit(route('routes.index'));
        } catch {
            setLoadError('Could not add route.');
        } finally {
            setProcessing(false);
        }
    };

    const inputClass = fieldInputClass(Boolean(errors.name), formControlClass);

    return (
        <>
            <Head title="Add Route" />

            <FormPage size="sm">
                {loadError && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {loadError}
                    </p>
                )}

                <FormCard>
                    <p className="mb-4 text-sm text-gray-600">
                        Route names appear in the invoice and entrybook &quot;From&quot; dropdown
                        after saving (e.g. J N P T / SARIGAM / 1X20).
                    </p>

                    <form onSubmit={submit} className="space-y-5">
                        <FormField width="lg">
                            <InputLabel value="From (Route)" />
                            <TextInput
                                className={inputClass}
                                value={name}
                                onChange={(e) => setRouteName(e.target.value)}
                                placeholder="J N P T / SARIGAM / 1X20"
                                autoFocus
                            />
                            <InputError message={errors.name} className="mt-1" />
                        </FormField>

                        <FormActions>
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Saving…' : 'Save Route'}
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
