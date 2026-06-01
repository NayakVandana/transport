import PageContainer from '@/Components/PageContainer';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit() {
    usePageHeader(
        <h2 className="text-xl font-semibold leading-tight text-gray-800">
            Profile
        </h2>,
    );

    return (
        <>
            <Head title="Profile" />

            <PageContainer className="space-y-6" width="4xl">
                <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                    <UpdateProfileInformationForm className="max-w-xl" />
                </div>

                <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                    <UpdatePasswordForm className="max-w-xl" />
                </div>

                <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                    <DeleteUserForm className="max-w-xl" />
                </div>
            </PageContainer>
        </>
    );
}
