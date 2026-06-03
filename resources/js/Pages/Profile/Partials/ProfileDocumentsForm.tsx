import EntityDocumentsSection, {
    uploadDocumentDrafts,
    type DocumentDraft,
} from '@/Components/EntityDocumentsSection';
import { FormActions } from '@/Components/FormPage';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import type { EntityDocument, ExpenseOption } from '@/types/transport';
import { Link, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

export default function ProfileDocumentsForm() {
    const [documentTypes, setDocumentTypes] = useState<ExpenseOption[]>([]);
    const [documents, setDocuments] = useState<EntityDocument[]>([]);
    const [documentDrafts, setDocumentDrafts] = useState<DocumentDraft[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        setLoading(true);

        void appApiPost<
            ApiEnvelope<{
                documents: EntityDocument[];
                document_types: ExpenseOption[];
            }>
        >('/profile/profile-show', {})
            .then((res) => {
                if (!res.success || !res.data) {
                    setLoadError(res.message || 'Could not load documents.');
                    return;
                }

                setDocuments(res.data.documents ?? []);
                setDocumentTypes(res.data.document_types ?? []);
            })
            .catch(() => {
                setLoadError('Could not load documents.');
            })
            .finally(() => setLoading(false));
    }, []);

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setLoadError(null);

        if (documentDrafts.length === 0) {
            return;
        }

        if (documentDrafts.some((draft) => !draft.file)) {
            setLoadError('Each document row needs a file, or remove empty rows.');
            return;
        }

        setProcessing(true);

        try {
            const uploaded = await uploadDocumentDrafts(
                '/profile/user-document-store',
                documentDrafts,
            );

            if (!uploaded) {
                setLoadError('Could not upload documents.');
                return;
            }

            router.visit(route('profile.show'));
        } catch {
            setLoadError('Could not upload documents.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return <p className="text-sm text-gray-500">Loading documents…</p>;
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            {loadError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {loadError}
                </p>
            )}

            <EntityDocumentsSection
                documentTypes={documentTypes}
                drafts={documentDrafts}
                onDraftsChange={setDocumentDrafts}
                savedDocuments={documents}
            />

            {documentDrafts.length > 0 && (
                <FormActions>
                    <PrimaryButton disabled={processing}>
                        {processing ? 'Saving…' : 'Save Documents'}
                    </PrimaryButton>
                    <Link href={route('profile.show')}>
                        <SecondaryButton type="button">Cancel</SecondaryButton>
                    </Link>
                </FormActions>
            )}
        </form>
    );
}
