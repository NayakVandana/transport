import ListingMobileCard from '@/Components/ListingMobileCard';
import ListingTableShell from '@/Components/ListingTableShell';
import { formatAppDateTime } from '@/lib/dateUtils';
import type { EntityDocument, ExpenseOption } from '@/types/transport';

type SavedDocumentsListProps = {
    documents: EntityDocument[];
    documentTypes: ExpenseOption[];
    title?: string;
};

export default function SavedDocumentsList({
    documents,
    documentTypes,
    title = 'Documents',
}: SavedDocumentsListProps) {
    const typeLabels = Object.fromEntries(documentTypes.map((item) => [item.value, item.label]));

    if (documents.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            <h3 className="font-medium text-gray-900">{title}</h3>
            <ListingTableShell
                className="overflow-hidden rounded-lg border border-gray-200"
                isEmpty={false}
                mobileCountLabel={`${documents.length} document${documents.length === 1 ? '' : 's'}`}
                emptyMessage=""
                mobile={documents.map((document, index) => (
                    <ListingMobileCard
                        key={document.id}
                        index={index + 1}
                        title={typeLabels[document.document_type] ?? document.document_type}
                        subtitle={document.title || 'Untitled'}
                        fields={[
                            {
                                label: 'Expiry',
                                value: formatAppDateTime(document.expiry_date),
                            },
                        ]}
                        actions={
                            document.file_url ? (
                                <a
                                    href={document.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex min-h-[2.25rem] items-center justify-center rounded-lg border border-indigo-600 bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white no-underline hover:bg-indigo-700"
                                >
                                    View file
                                </a>
                            ) : undefined
                        }
                    />
                ))}
                thead={
                    <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Type</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Title</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Expiry</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-500">File</th>
                    </tr>
                }
                tbody={documents.map((document) => (
                    <tr key={document.id}>
                        <td className="px-4 py-2">
                            {typeLabels[document.document_type] ?? document.document_type}
                        </td>
                        <td className="px-4 py-2 text-gray-600">{document.title || '—'}</td>
                        <td className="px-4 py-2 text-gray-600">
                            {formatAppDateTime(document.expiry_date)}
                        </td>
                        <td className="px-4 py-2 text-right">
                            {document.file_url ? (
                                <a
                                    href={document.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:underline"
                                >
                                    View
                                </a>
                            ) : (
                                '—'
                            )}
                        </td>
                    </tr>
                ))}
            />
        </div>
    );
}
