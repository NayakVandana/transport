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
import { clearAuthUserCache, useAuthUser } from '@/auth/useAuthUser';
import type { User } from '@/types';
import { Link, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

export default function UpdateProfileInformation() {
    const { user, refresh } = useAuthUser();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
        }
    }, [user]);

    const setField = (field: 'name' | 'email', value: string) => {
        if (field === 'name') {
            setName(value);
        } else {
            setEmail(value);
        }

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

        try {
            const res = await appApiPost<ApiEnvelope<{ user: User }>>('/profile/profile-update', {
                name,
                email,
            });

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
        <form onSubmit={submit} className="space-y-5">
            <FormSectionHeader
                title="Profile Information"
                description="Update your name and email address."
            />

            <FormField width="md">
                <InputLabel htmlFor="name" value="Name" />
                <TextInput
                    id="name"
                    className={inputClass('name')}
                    value={name}
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
                    value={email}
                    onChange={(e) => setField('email', e.target.value)}
                    required
                    autoComplete="username"
                />
                <InputError className="mt-1" message={errors.email} />
            </FormField>

            {user && !user.email_verified_at && (
                <p className="text-sm text-amber-700">Your email address is unverified.</p>
            )}

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
