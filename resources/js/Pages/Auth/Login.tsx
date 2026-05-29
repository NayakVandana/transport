import Checkbox from '@/Components/Checkbox';
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
import { getPostAuthRedirect, registerUrl } from '@/utils/requireAuth';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

type LoginResponse = ApiEnvelope<{
    user: User;
    token: string;
}>;

export default function Login({
    status,
    canResetPassword,
    redirect,
}: {
    status?: string;
    canResetPassword: boolean;
    redirect?: string | null;
}) {
    const { isLoggedIn } = useAuthUser();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
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
            const res = await apiPost<LoginResponse>('/api/v1/auth/auth-login', {
                email,
                password,
            });

            if (!res.success || !res.data?.token) {
                setErrors({ email: res.message || 'Invalid credentials.' });

                return;
            }

            setUserApiToken(res.data.token);
            seedAuthUserCache(res.data.user);

            router.visit(getPostAuthRedirect(redirect, route('dashboard')));
        } catch {
            setErrors({ email: 'Could not sign in.' });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setEmail(e.target.value)}
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
                        autoComplete="current-password"
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 block">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={remember}
                            onChange={(e) =>
                                setRemember(e.target.checked || false)
                            }
                        />
                        <span className="ms-2 text-sm text-gray-600">
                            Remember me
                        </span>
                    </label>
                </div>

                <div className="mt-4 flex items-center justify-end">
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Forgot your password?
                        </Link>
                    )}

                    <PrimaryButton className="ms-4" disabled={processing}>
                        Log in
                    </PrimaryButton>
                </div>
            </form>

            <p className="mt-4 text-center text-sm text-gray-600">
                No account?{' '}
                <Link
                    href={registerUrl(redirect ?? undefined)}
                    className="font-medium text-indigo-600 underline hover:text-gray-900"
                >
                    Register
                </Link>
            </p>
        </GuestLayout>
    );
}
