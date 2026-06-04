import SavedDocumentsList from '@/Components/SavedDocumentsList';
import AddressDetailSection from '@/Components/AddressDetailSection';
import { DetailGrid, DetailItem } from '@/Components/DetailShow';
import FormPage, { FormCard, FormSectionHeader } from '@/Components/FormPage';
import { DetailPageHeader, HeaderCreateButton } from '@/Components/ListPageHeader';
import SecondaryButton from '@/Components/SecondaryButton';
import { useAuthUser } from '@/auth/useAuthUser';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { usePageHeader } from '@/hooks/usePageHeader';
import { formatAppDateTime } from '@/lib/dateUtils';
import type { EntityDocument, ExpenseOption } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

function DetailItemLocal({ label, value }: { label: string; value?: string | null }) {
    return <DetailItem label={label} value={value} />;
}

export default function ProfileShow() {
    const { user, loading } = useAuthUser();
    const [documents, setDocuments] = useState<EntityDocument[]>([]);
    const [documentTypes, setDocumentTypes] = useState<ExpenseOption[]>([]);

    useEffect(() => {
        void appApiPost<
            ApiEnvelope<{
                documents: EntityDocument[];
                document_types: ExpenseOption[];
            }>
        >('/profile/profile-show', {})
            .then((res) => {
                if (res.success && res.data) {
                    setDocuments(res.data.documents ?? []);
                    setDocumentTypes(res.data.document_types ?? []);
                }
            })
            .catch(() => {});
    }, []);

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
                            {user.photo_url && (
                                <div className="mb-4">
                                    <img
                                        src={user.photo_url}
                                        alt="User photo"
                                        className="h-16 w-16 rounded-lg border border-gray-200 bg-gray-50 object-contain"
                                    />
                                </div>
                            )}
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
                            <div className="mt-4">
                                <AddressDetailSection data={user} />
                            </div>
                        </FormCard>

                        {documents.length > 0 && (
                            <FormCard>
                                <SavedDocumentsList
                                    documents={documents}
                                    documentTypes={documentTypes}
                                />
                            </FormCard>
                        )}

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
