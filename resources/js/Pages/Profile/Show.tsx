import FormPage, { FormCard, FormSectionHeader } from '@/Components/FormPage';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useAuthUser } from '@/auth/useAuthUser';
import { usePageHeader } from '@/hooks/usePageHeader';
import { formatAppDateTime } from '@/lib/dateUtils';
import { Head, Link } from '@inertiajs/react';

function DetailItem({ label, value }: { label: string; value?: string | null }) {
    return (
        <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900">{value?.trim() ? value : '—'}</dd>
        </div>
    );
}

export default function ProfileShow() {
    const { user, loading } = useAuthUser();

    usePageHeader(
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <h2 className="text-xl font-semibold text-gray-800">Profile</h2>
            <Link href={route('profile.edit')}>
                <PrimaryButton type="button">Edit Profile</PrimaryButton>
            </Link>
        </div>,
    );

    return (
        <>
            <Head title="Profile" />

            <FormPage size="sm">
                {loading ? (
                    <p className="py-8 text-center text-sm text-gray-500">Loading…</p>
                ) : !user ? (
                    <FormCard>
                        <p className="text-sm text-gray-600">Could not load profile.</p>
                    </FormCard>
                ) : (
                    <div className="space-y-5">
                        <FormCard>
                            <FormSectionHeader title="Account Information" />
                            <dl className="grid gap-4 sm:grid-cols-2">
                                <DetailItem label="Name" value={user.name} />
                                <DetailItem label="Email" value={user.email} />
                                <DetailItem
                                    label="Email Status"
                                    value={
                                        user.email_verified_at
                                            ? `Verified on ${formatAppDateTime(user.email_verified_at, '')}`
                                            : 'Not verified'
                                    }
                                />
                            </dl>
                        </FormCard>

                        <div className="flex flex-wrap gap-3">
                            <Link href={route('profile.edit')}>
                                <SecondaryButton type="button">Edit Profile</SecondaryButton>
                            </Link>
                        </div>
                    </div>
                )}
            </FormPage>
        </>
    );
}
