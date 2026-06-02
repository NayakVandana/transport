import {
    FormActions,
    FormField,
    FormSectionHeader,
    formControlClass,
} from '@/Components/FormPage';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { applyApiFormErrors, fieldInputClass } from '@/lib/apiFormErrors';
import { Transition } from '@headlessui/react';
import { FormEventHandler, useRef, useState } from 'react';

export default function UpdatePasswordForm() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);

    const reset = (...fields: ('current_password' | 'password' | 'password_confirmation')[]) => {
        if (fields.includes('current_password')) setCurrentPassword('');
        if (fields.includes('password')) setPassword('');
        if (fields.includes('password_confirmation')) setPasswordConfirmation('');
    };

    const updatePassword: FormEventHandler = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        setRecentlySuccessful(false);

        try {
            const res = await appApiPost<ApiEnvelope<null>>('/profile/profile-password-update', {
                current_password: currentPassword,
                password,
                password_confirmation: passwordConfirmation,
            });

            if (!res.success) {
                const fieldErrors = applyApiFormErrors(res, {
                    fallbackField: 'current_password',
                    fallbackMessage: 'Could not update password.',
                });
                setErrors(fieldErrors);

                if (fieldErrors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (fieldErrors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }

                return;
            }

            reset('current_password', 'password', 'password_confirmation');
            setRecentlySuccessful(true);
        } catch {
            setErrors({ current_password: 'Could not update password.' });
        } finally {
            setProcessing(false);
        }
    };

    const inputClass = (field: 'current_password' | 'password' | 'password_confirmation') =>
        fieldInputClass(Boolean(errors[field]), formControlClass);

    return (
        <form onSubmit={updatePassword} className="space-y-5">
            <FormSectionHeader
                title="Update Password"
                description="Use a long, random password to keep your account secure."
            />

            <FormField width="md">
                <InputLabel htmlFor="current_password" value="Current Password" />
                <TextInput
                    id="current_password"
                    ref={currentPasswordInput}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    type="password"
                    className={inputClass('current_password')}
                    autoComplete="current-password"
                />
                <InputError message={errors.current_password} className="mt-1" />
            </FormField>

            <FormField width="md">
                <InputLabel htmlFor="password" value="New Password" />
                <TextInput
                    id="password"
                    ref={passwordInput}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    className={inputClass('password')}
                    autoComplete="new-password"
                />
                <InputError message={errors.password} className="mt-1" />
            </FormField>

            <FormField width="md">
                <InputLabel htmlFor="password_confirmation" value="Confirm Password" />
                <TextInput
                    id="password_confirmation"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    type="password"
                    className={inputClass('password_confirmation')}
                    autoComplete="new-password"
                />
                <InputError message={errors.password_confirmation} className="mt-1" />
            </FormField>

            <FormActions>
                <PrimaryButton disabled={processing}>
                    {processing ? 'Saving…' : 'Update Password'}
                </PrimaryButton>

                <Transition
                    show={recentlySuccessful}
                    enter="transition ease-in-out"
                    enterFrom="opacity-0"
                    leave="transition ease-in-out"
                    leaveTo="opacity-0"
                >
                    <p className="text-sm text-gray-600">Password updated.</p>
                </Transition>
            </FormActions>
        </form>
    );
}
