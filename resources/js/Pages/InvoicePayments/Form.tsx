import PageContainer from '@/Components/PageContainer';
import RecordPaymentForm from '@/Components/RecordPaymentForm';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Head } from '@inertiajs/react';

export default function InvoicePaymentForm({
    invoicePaymentId,
    partyId,
}: {
    invoicePaymentId?: number;
    partyId?: number | null;
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

            <PageContainer width="2xl">
                    <div className="rounded-lg bg-white p-6 shadow">
                        <RecordPaymentForm
                            invoicePaymentId={invoicePaymentId}
                            partyId={partyId}
                            showCancelLink
                        />
                    </div>
            </PageContainer>
        </>
    );
}
