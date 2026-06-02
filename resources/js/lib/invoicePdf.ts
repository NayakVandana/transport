import { appApiDownload } from '@/api/appClient';

export async function downloadInvoicePdf(
    invoiceId: number,
    billNumber: string,
): Promise<void> {
    const safeName = billNumber.replace(/[^\w\-]+/g, '-');

    await appApiDownload(
        '/invoices/invoice-download-pdf',
        { id: invoiceId },
        `${safeName || 'invoice'}.pdf`,
    );
}
