import RecordPaymentForm from '@/Components/RecordPaymentForm';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Head } from '@inertiajs/react';

export default function InvoicePaymentForm({
    invoicePaymentId,
    invoiceId,
}: {
    invoicePaymentId?: number;
    invoiceId?: number | null;
}) {
    const isEdit = Boolean(invoicePaymentId);

    usePageHeader(
        <h2 className="text-xl font-semibold text-gray-800">
            {isEdit ? 'Edit Payment' : 'Record Payment'}
        </h2>,
    );

    return (
        <>
            <Head title={isEdit ? 'Edit Payment' : 'Record Payment'} />

            <div className="py-8">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="rounded-lg bg-white p-6 shadow">
                        <RecordPaymentForm
                            invoicePaymentId={invoicePaymentId}
                            invoiceId={invoiceId}
                            showCancelLink
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
