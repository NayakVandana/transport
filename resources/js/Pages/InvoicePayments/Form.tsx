import { FormPageHeader } from '@/Components/ListPageHeader';
import FormPage, { FormCard } from '@/Components/FormPage';
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
        <FormPageHeader
            title={isEdit ? 'Edit Payment' : 'Record Payment'}
            backHref={route('invoice-payments.index')}
            backLabel="Back to list"
            backMobileLabel="Back"
        />,
    );

    return (
        <>
            <Head title={isEdit ? 'Edit Payment' : 'Record Payment'} />

            <FormPage size="sm">
                <FormCard>
                    <RecordPaymentForm
                        invoicePaymentId={invoicePaymentId}
                        partyId={partyId}
                        showCancelLink
                    />
                </FormCard>
            </FormPage>
        </>
    );
}
