import { appApiDownload } from '@/api/appClient';

export async function downloadLoadingSlipPdf(loadingSlipId: number, slipDate: string): Promise<void> {
    const safeName = slipDate.replace(/[^\w\-]+/g, '-');
    await appApiDownload(
        '/loading-slips/loading-slip-download-pdf',
        { id: loadingSlipId },
        `loading-slip-${safeName || loadingSlipId}.pdf`,
    );
}
