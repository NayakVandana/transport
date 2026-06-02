import FormPage from '@/Components/FormPage';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Head } from '@inertiajs/react';
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

            <FormPage size="md" className="space-y-6">
                <div className="rounded-lg bg-white p-4 shadow sm:p-6 lg:p-8">
                    <UpdateProfileInformationForm className="w-full max-w-none" />
                </div>

                <div className="rounded-lg bg-white p-4 shadow sm:p-6 lg:p-8">
                    <UpdatePasswordForm className="w-full max-w-none" />
                </div>
            </FormPage>
        </>
    );
}
