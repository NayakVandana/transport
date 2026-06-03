import { FormPageHeader } from '@/Components/ListPageHeader';
import FormPage, { FormCard } from '@/Components/FormPage';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Head } from '@inertiajs/react';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import ProfileDocumentsForm from './Partials/ProfileDocumentsForm';
import ProfileLogoForm from './Partials/ProfileLogoForm';

export default function ProfileEdit() {
    usePageHeader(
        <FormPageHeader
            title="Edit Profile"
            backHref={route('profile.show')}
            backLabel="Back to profile"
        />,
    );

    return (
        <>
            <Head title="Edit Profile" />

            <FormPage size="sm" className="space-y-5">
                <FormCard>
                    <UpdateProfileInformationForm />
                </FormCard>

                <FormCard>
                    <ProfileLogoForm />
                </FormCard>

                <FormCard>
                    <UpdatePasswordForm />
                </FormCard>

                <FormCard>
                    <ProfileDocumentsForm />
                </FormCard>
            </FormPage>
        </>
    );
}
