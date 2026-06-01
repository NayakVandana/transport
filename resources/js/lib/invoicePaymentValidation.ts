export type InvoicePaymentFormData = {
    party_id: string;
    payment_date: string;
    amount: string;
    payment_mode: string;
    reference_no: string;
    notes: string;
};

export function validateInvoicePaymentForm(
    data: InvoicePaymentFormData,
    maxAmount: number | null,
    formatAmount: (value: number) => string,
): Partial<Record<keyof InvoicePaymentFormData, string>> {
    const errors: Partial<Record<keyof InvoicePaymentFormData, string>> = {};

    if (!data.party_id) {
        errors.party_id = 'Select a party (receiver).';
    }

    if (!data.payment_date) {
        errors.payment_date = 'Payment date is required.';
    }

    if (!data.amount.trim()) {
        errors.amount = 'Enter a valid amount.';
    } else if (Number.isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
        errors.amount = 'Enter a valid amount.';
    } else if (maxAmount !== null && Number(data.amount) > maxAmount) {
        errors.amount = `Amount cannot exceed outstanding (₹ ${formatAmount(maxAmount)}).`;
    }

    if (data.reference_no.length > 100) {
        errors.reference_no = 'Reference number cannot exceed 100 characters.';
    }

    if (data.notes.length > 500) {
        errors.notes = 'Notes cannot exceed 500 characters.';
    }

    return errors;
}
