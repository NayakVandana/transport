import AddressFormFields from '@/Components/AddressFormFields';
import {
    FormActions,
    FormField,
    FormSectionHeader,
    formControlClass,
} from '@/Components/FormPage';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { applyApiFormErrors, fieldInputClass } from '@/lib/apiFormErrors';
import {
    addressFromEntity,
    defaultAddressForm,
    normalizeAddressPayload,
    validateAddressForm,
    type AddressFormData,
} from '@/lib/addressValidation';
import { clearAuthUserCache, useAuthUser } from '@/auth/useAuthUser';
import type { User } from '@/types';
import { Link, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

type ProfileFormData = {
    name: string;
    email: string;
} & AddressFormData;

export default function UpdateProfileInformation() {
    const { user, refresh } = useAuthUser();
    const [data, setData] = useState<ProfileFormData>({
        name: '',
        email: '',
        ...defaultAddressForm(),
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (user) {
            setData({
                name: user.name,
                email: user.email,
                ...addressFromEntity(user),
            });
        }
    }, [user]);

    const setField = <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => {
        setData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const clientErrors: Record<string, string> = {
            ...validateAddressForm(data),
        };

        if (!data.name.trim()) {
            clientErrors.name = 'Name is required.';
        }
        if (!data.email.trim()) {
            clientErrors.email = 'Email is required.';
        }

        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            setProcessing(false);
            return;
        }

        try {
            const res = await appApiPost<ApiEnvelope<{ user: User }>>(
                '/profile/profile-update',
                normalizeAddressPayload(data),
            );

            if (!res.success) {
                setErrors(
                    applyApiFormErrors(res, {
                        fallbackField: 'email',
                        fallbackMessage: 'Could not update profile.',
                    }),
                );
                return;
            }

            clearAuthUserCache();
            await refresh();
            router.visit(route('profile.show'));
        } catch {
            setErrors({ email: 'Could not update profile.' });
        } finally {
            setProcessing(false);
        }
    };

    const inputClass = (field: 'name' | 'email') =>
        fieldInputClass(Boolean(errors[field]), formControlClass);

    return (
        <form onSubmit={submit} className="space-y-6">
            <FormSectionHeader
                title="Profile Information"
                description="Update your name, email, and address."
            />

            <FormField width="md">
                <InputLabel htmlFor="name" value="Name" />
                <TextInput
                    id="name"
                    className={inputClass('name')}
                    value={data.name}
                    onChange={(e) => setField('name', e.target.value)}
                    required
                    autoFocus
                    autoComplete="name"
                />
                <InputError className="mt-1" message={errors.name} />
            </FormField>

            <FormField width="md">
                <InputLabel htmlFor="email" value="Email" />
                <TextInput
                    id="email"
                    type="email"
                    className={inputClass('email')}
                    value={data.email}
                    onChange={(e) => setField('email', e.target.value)}
                    required
                    autoComplete="username"
                />
                <InputError className="mt-1" message={errors.email} />
            </FormField>

            {user && !user.email_verified_at && (
                <p className="text-sm text-amber-700">Your email address is unverified.</p>
            )}

            <AddressFormFields
                data={data}
                errors={errors}
                onChange={(field, value) => setField(field, value)}
            />

            <FormActions>
                <PrimaryButton disabled={processing}>
                    {processing ? 'Saving…' : 'Save Profile'}
                </PrimaryButton>
                <Link href={route('profile.show')}>
                    <SecondaryButton type="button">Cancel</SecondaryButton>
                </Link>
            </FormActions>
        </form>
    );
}
