export function documentsWithoutLegacyLogo<T extends { document_type: string }>(
    documents: T[],
): T[] {
    return documents.filter((document) => document.document_type !== 'logo');
}
