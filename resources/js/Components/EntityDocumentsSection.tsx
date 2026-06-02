import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import SecondaryButton from '@/Components/SecondaryButton';
import { appApiPost, appApiPostFormData, type ApiEnvelope } from '@/api/appClient';
import { formatAppDateTime } from '@/lib/dateUtils';
import { formControlClass } from '@/Components/FormPage';
import type { EntityDocument, ExpenseOption } from '@/types/transport';

export type DocumentDraft = {
    id: string;
    document_type: string;
    title: string;
    expiry_date: string;
    notes: string;
    file: File | null;
};

export function emptyDocumentDraft(
    documentTypes: ExpenseOption[],
    id = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
): DocumentDraft {
    return {
        id,
        document_type: documentTypes[0]?.value ?? 'other',
        title: '',
        expiry_date: '',
        notes: '',
        file: null,
    };
}

export async function uploadDocumentDrafts(
    entityId: number,
    entityIdField: 'vehicle_id' | 'driver_id',
    storePath: string,
    drafts: DocumentDraft[],
): Promise<boolean> {
    for (const draft of drafts) {
        if (!draft.file) {
            continue;
        }

        const formData = new FormData();
        formData.append(entityIdField, String(entityId));
        formData.append('document_type', draft.document_type);
        if (draft.title) {
            formData.append('title', draft.title);
        }
        if (draft.expiry_date) {
            formData.append('expiry_date', draft.expiry_date);
        }
        if (draft.notes) {
            formData.append('notes', draft.notes);
        }
        formData.append('file', draft.file);

        const res = await appApiPostFormData<ApiEnvelope<{ document: EntityDocument }>>(
            storePath,
            formData,
        );

        if (!res.success) {
            return false;
        }
    }

    return true;
}

export async function deleteEntityDocuments(
    destroyPath: string,
    ids: number[],
): Promise<boolean> {
    for (const id of ids) {
        const res = await appApiPost<ApiEnvelope<null>>(destroyPath, { id });
        if (!res.success) {
            return false;
        }
    }

    return true;
}

type EntityDocumentsSectionProps = {
    documentTypes: ExpenseOption[];
    drafts: DocumentDraft[];
    onDraftsChange: (drafts: DocumentDraft[]) => void;
    savedDocuments?: EntityDocument[];
    documentsToDelete?: number[];
    onDocumentsToDeleteChange?: (ids: number[]) => void;
};

export default function EntityDocumentsSection({
    documentTypes,
    drafts,
    onDraftsChange,
    savedDocuments = [],
    documentsToDelete = [],
    onDocumentsToDeleteChange,
}: EntityDocumentsSectionProps) {
    const typeLabels = Object.fromEntries(documentTypes.map((item) => [item.value, item.label]));

    const updateDraft = (id: string, patch: Partial<DocumentDraft>) => {
        onDraftsChange(
            drafts.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)),
        );
    };

    const removeDraft = (id: string) => {
        onDraftsChange(drafts.filter((draft) => draft.id !== id));
    };

    const toggleDeleteSaved = (id: number) => {
        if (!onDocumentsToDeleteChange) {
            return;
        }

        if (documentsToDelete.includes(id)) {
            onDocumentsToDeleteChange(documentsToDelete.filter((item) => item !== id));
        } else {
            onDocumentsToDeleteChange([...documentsToDelete, id]);
        }
    };

    const selectClass = formControlClass;

    const visibleSaved = savedDocuments.filter((doc) => !documentsToDelete.includes(doc.id));

    return (
        <div className="space-y-4 border-t border-gray-200 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="font-medium text-gray-900">Documents</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Add files below — they save together when you click Save.
                    </p>
                </div>
                <SecondaryButton
                    type="button"
                    onClick={() =>
                        onDraftsChange([...drafts, emptyDocumentDraft(documentTypes)])
                    }
                >
                    Add document
                </SecondaryButton>
            </div>

            {visibleSaved.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium text-gray-500">Type</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-500">Title</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-500">Expiry</th>
                                <th className="px-4 py-2 text-right font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {visibleSaved.map((document) => (
                                <tr key={document.id}>
                                    <td className="px-4 py-2">
                                        {typeLabels[document.document_type] ?? document.document_type}
                                    </td>
                                    <td className="px-4 py-2 text-gray-600">
                                        {document.title || '—'}
                                    </td>
                                    <td className="px-4 py-2 text-gray-600">
                                        {formatAppDateTime(document.expiry_date)}
                                    </td>
                                    <td className="space-x-3 px-4 py-2 text-right">
                                        {document.file_url && (
                                            <a
                                                href={document.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 hover:underline"
                                            >
                                                View
                                            </a>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => toggleDeleteSaved(document.id)}
                                            className="text-red-600 hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {drafts.length === 0 && visibleSaved.length === 0 && (
                <p className="text-sm text-gray-500">No documents added.</p>
            )}

            {drafts.map((draft, index) => (
                <div
                    key={draft.id}
                    className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
                >
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">Document {index + 1}</p>
                        <button
                            type="button"
                            onClick={() => removeDraft(draft.id)}
                            className="text-sm text-red-600 hover:underline"
                        >
                            Remove
                        </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel value="Document type" />
                            <select
                                className={selectClass}
                                value={draft.document_type}
                                onChange={(e) =>
                                    updateDraft(draft.id, { document_type: e.target.value })
                                }
                            >
                                {documentTypes.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel value="Title (optional)" />
                            <input
                                type="text"
                                className={selectClass}
                                value={draft.title}
                                onChange={(e) => updateDraft(draft.id, { title: e.target.value })}
                                placeholder="e.g. 2026 policy copy"
                            />
                        </div>
                        <div>
                            <InputLabel value="Expiry date (optional)" />
                            <input
                                type="date"
                                className={selectClass}
                                value={draft.expiry_date}
                                onChange={(e) =>
                                    updateDraft(draft.id, { expiry_date: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <InputLabel value="File" />
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                                className="mt-1 block w-full text-sm text-gray-600"
                                onChange={(e) =>
                                    updateDraft(draft.id, {
                                        file: e.target.files?.[0] ?? null,
                                    })
                                }
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                JPEG, PNG, or PDF up to 5 MB.
                            </p>
                            {draft.file && (
                                <p className="mt-1 text-xs text-gray-600">{draft.file.name}</p>
                            )}
                        </div>
                    </div>
                    <div>
                        <InputLabel value="Notes (optional)" />
                        <textarea
                            className={selectClass}
                            rows={2}
                            value={draft.notes}
                            onChange={(e) => updateDraft(draft.id, { notes: e.target.value })}
                        />
                    </div>
                    {!draft.file && (
                        <InputError message="Choose a file for this document." />
                    )}
                </div>
            ))}
        </div>
    );
}
