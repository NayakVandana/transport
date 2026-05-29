import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import type { ApiEnvelope } from '@/api/apiClient';
import { apiPost } from '@/api/apiClient';
import { seedAuthUserCache, useAuthUser } from '@/auth/useAuthUser';
import { setUserApiToken } from '@/auth/authToken';
import GuestLayout from '@/Layouts/GuestLayout';
import type { User } from '@/types';
import { getPostAuthRedirect, loginUrl } from '@/utils/requireAuth';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

type RegisterResponse = ApiEnvelope<{
    user: User;
    token: string;
}>;

export default function Register({
    redirect,
}: {
    redirect?: string | null;
}) {
    const { isLoggedIn } = useAuthUser();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isLoggedIn) {
            router.visit(getPostAuthRedirect(redirect, route('dashboard')));
        }
    }, [isLoggedIn, redirect]);

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const res = await apiPost<RegisterResponse>(
                '/api/v1/auth/auth-register',
                {
                    name,
                    email,
                    password,
                    password_confirmation: passwordConfirmation,
                },
            );

            if (!res.success || !res.data?.token) {
                setErrors({ email: res.message || 'Registration failed.' });

                return;
            }

            setUserApiToken(res.data.token);
            seedAuthUserCache(res.data.user);

            router.visit(getPostAuthRedirect(redirect, route('dashboard')));
        } catch {
            setErrors({ email: 'Could not register.' });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        name="name"
                        value={name}
                        className="mt-1 block w-full"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                    />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={passwordConfirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setPasswordConfirmation(e.target.value)
                        }
                        required
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <Link
                        href={loginUrl(redirect ?? undefined)}
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Already registered?
                    </Link>

                    <PrimaryButton className="ms-4" disabled={processing}>
                        Register
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
