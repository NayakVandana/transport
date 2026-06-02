import FormPage, { FormCard } from '@/Components/FormPage';
import RecordPaymentForm from '@/Components/RecordPaymentForm';
import SecondaryButton from '@/Components/SecondaryButton';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Head, Link } from '@inertiajs/react';

export default function InvoicePaymentForm({
    invoicePaymentId,
    partyId,
}: {
    invoicePaymentId?: number;
    partyId?: number | null;
}) {
    const isEdit = Boolean(invoicePaymentId);

    usePageHeader(
        <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-800">
                {isEdit ? 'Edit Payment' : 'Record Payment'}
            </h2>
            <Link href={route('invoice-payments.index')}>
                <SecondaryButton type="button">Back to list</SecondaryButton>
            </Link>
        </div>,
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
