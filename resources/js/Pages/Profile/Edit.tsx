import FormPage, { FormCard } from '@/Components/FormPage';
import SecondaryButton from '@/Components/SecondaryButton';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Head, Link } from '@inertiajs/react';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function ProfileEdit() {
    usePageHeader(
        <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-800">Edit Profile</h2>
            <Link href={route('profile.show')}>
                <SecondaryButton type="button">Back to profile</SecondaryButton>
            </Link>
        </div>,
    );

    return (
        <>
            <Head title="Edit Profile" />

            <FormPage size="sm" className="space-y-5">
                <FormCard>
                    <UpdateProfileInformationForm />
                </FormCard>

                <FormCard>
                    <UpdatePasswordForm />
                </FormCard>
            </FormPage>
        </>
    );
}
