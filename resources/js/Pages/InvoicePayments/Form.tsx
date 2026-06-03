import { FormPageHeader } from '@/Components/ListPageHeader';
import FormPage, { FormCard } from '@/Components/FormPage';
import RecordPaymentForm from '@/Components/RecordPaymentForm';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Head } from '@inertiajs/react';

export default function InvoicePaymentForm({
    partyId,
    invoiceId,
}: {
    partyId?: number | null;
    invoiceId?: number | null;
}) {
    usePageHeader(
        <FormPageHeader
            title="Record Payment"
            backHref={route('invoice-payments.index')}
            backLabel="Back to list"
            backMobileLabel="Back"
        />,
    );

    return (
        <>
            <Head title="Record Payment" />

            <FormPage size="sm">
                <FormCard>
                    <RecordPaymentForm partyId={partyId} invoiceId={invoiceId} showCancelLink />
                </FormCard>
            </FormPage>
        </>
    );
}
