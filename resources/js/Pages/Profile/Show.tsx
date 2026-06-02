import { DetailGrid, DetailItem } from '@/Components/DetailShow';
import FormPage, { FormCard, FormSectionHeader } from '@/Components/FormPage';
import { DetailPageHeader, HeaderCreateButton } from '@/Components/ListPageHeader';
import SecondaryButton from '@/Components/SecondaryButton';
import { useAuthUser } from '@/auth/useAuthUser';
import { usePageHeader } from '@/hooks/usePageHeader';
import { formatAppDateTime } from '@/lib/dateUtils';
import { Head, Link } from '@inertiajs/react';

function DetailItemLocal({ label, value }: { label: string; value?: string | null }) {
    return <DetailItem label={label} value={value} />;
}

export default function ProfileShow() {
    const { user, loading } = useAuthUser();

    usePageHeader(
        <DetailPageHeader
            title="Profile"
            actions={
                <HeaderCreateButton
                    href={route('profile.edit')}
                    label="Edit Profile"
                    mobileLabel="Edit"
                />
            }
        />,
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
                            <DetailGrid>
                                <DetailItemLocal label="Name" value={user.name} />
                                <DetailItemLocal label="Email" value={user.email} />
                                <DetailItemLocal
                                    label="Email Status"
                                    value={
                                        user.email_verified_at
                                            ? `Verified on ${formatAppDateTime(user.email_verified_at, '')}`
                                            : 'Not verified'
                                    }
                                />
                            </DetailGrid>
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
