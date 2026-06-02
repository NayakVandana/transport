import TaxInvoiceDocument from '@/invoices/TaxInvoiceDocument';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import type { FreightInvoice } from '@/types/transport';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function InvoicePrint({ invoiceId }: { invoiceId: number }) {
    const [invoice, setInvoice] = useState<FreightInvoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);

        void appApiPost<ApiEnvelope<{ invoice: FreightInvoice }>>('/invoices/invoice-show', {
            id: invoiceId,
        })
            .then((res) => {
                if (!res.success || !res.data?.invoice) {
                    setError(res.message || 'Could not load invoice.');
                    return;
                }

                setInvoice(res.data.invoice);
            })
            .catch(() => {
                setError('Could not load invoice.');
            })
            .finally(() => setLoading(false));
    }, [invoiceId]);

    if (loading) {
        return <p className="p-8 text-center text-sm text-gray-500">Loading invoice…</p>;
    }

    if (error || !invoice) {
        return (
            <p className="m-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error ?? 'Invoice not found.'}
            </p>
        );
    }

    return (
        <>
            <Head title={`Print ${invoice.bill_number}`} />
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { margin: 0; background: white; }
                }
            `}</style>

            <div className="no-print border-b bg-gray-100 px-4 py-3 text-center">
                <button
                    type="button"
                    onClick={() => window.print()}
                    className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
                >
                    Print Invoice
                </button>
            </div>

            <div className="overflow-x-auto bg-gray-100 py-4 print:bg-white print:py-0">
                <TaxInvoiceDocument invoice={invoice} />
            </div>
        </>
    );
}
