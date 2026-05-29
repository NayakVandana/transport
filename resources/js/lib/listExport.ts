import { appApiDownload } from '@/api/appClient';
import { buildListFilterParams, type ListFilters } from '@/lib/listFilters';

export async function exportFilteredList(
    resource: string,
    type: 'csv' | 'pdf',
    filters: ListFilters & Record<string, string | undefined>,
): Promise<void> {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const params = buildListFilterParams(filters);

    await appApiDownload(
        `/${resource}/${resource}-export-${type}`,
        params,
        `${resource}-${stamp}.${type}`,
    );
}
