import { invoiceFromEntrybookHref } from '@/lib/invoiceReturn';
import { Link } from '@inertiajs/react';

export type EntrybookBillTarget = {
    id: number;
    party_id?: number | null;
    party?: { id?: number } | null;
    invoice_id?: number | null;
    bill_number?: string | null;
};

export function EntrybookBillCell({
    entry,
    partyId,
}: {
    entry: EntrybookBillTarget;
    partyId?: number;
}) {
    if (entry.invoice_id && entry.bill_number) {
        return (
            <Link
                href={route('invoices.show', entry.invoice_id)}
                className="font-mono text-indigo-600 hover:underline"
            >
                {entry.bill_number}
            </Link>
        );
    }

    return (
        <Link
            href={invoiceFromEntrybookHref(entry, partyId)}
            className="inline-flex items-center rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 no-underline hover:bg-amber-100"
        >
            Bill Pending
        </Link>
    );
}

export function entrybookHasInvoice(entry: EntrybookBillTarget): boolean {
    return Boolean(entry.invoice_id && entry.bill_number);
}
