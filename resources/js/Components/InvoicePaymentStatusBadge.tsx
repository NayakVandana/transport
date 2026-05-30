import type { InvoicePaymentStatus } from '@/types/transport';

const labels: Record<InvoicePaymentStatus, string> = {
    paid: 'Paid',
    partial: 'Partial',
    pending: 'Pending',
};

const styles: Record<InvoicePaymentStatus, string> = {
    paid: 'bg-green-100 text-green-800',
    partial: 'bg-amber-100 text-amber-800',
    pending: 'bg-red-100 text-red-800',
};

export function invoicePaymentStatusFromAmounts(
    received: number | string,
    outstanding: number | string,
): InvoicePaymentStatus {
    const receivedNum = Number(received);
    const outstandingNum = Number(outstanding);

    if (outstandingNum <= 0) {
        return 'paid';
    }

    if (receivedNum > 0) {
        return 'partial';
    }

    return 'pending';
}

export default function InvoicePaymentStatusBadge({
    status,
}: {
    status: InvoicePaymentStatus | string;
}) {
    const key = status as InvoicePaymentStatus;
    const label = labels[key] ?? status;
    const className = styles[key] ?? 'bg-gray-100 text-gray-800';

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${className}`}
        >
            {label}
        </span>
    );
}
