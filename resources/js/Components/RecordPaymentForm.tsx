import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { formatMoney } from '@/lib/freightCalculator';
import type { InvoicePayment, OpenInvoiceOption, Party } from '@/types/transport';
import { Link, router } from '@inertiajs/react';
import { FormEventHandler, useCallback, useEffect, useMemo, useState } from 'react';

function dateInputValue(value?: string | null): string {
    return value?.slice(0, 10) ?? '';
}

type PaymentFormData = {
    party_id: string;
    freight_invoice_id: string;
    payment_date: string;
    amount: string;
    payment_mode: string;
    reference_no: string;
    notes: string;
};

type InvoicePaymentMetaData = {
    parties: Pick<Party, 'id' | 'name'>[];
    openInvoices: OpenInvoiceOption[];
    paymentModes: string[];
};

type InvoicePaymentShowData = InvoicePaymentMetaData & {
    invoicePayment: InvoicePayment;
    invoiceSummary: { received: number; outstanding: number };
};

export type LockedPaymentInvoice = {
    id: number;
    bill_number: string;
    party_name?: string;
    balance_amount: number | string;
    received?: number | string;
    outstanding?: number | string;
};

function apiFieldErrors(data: unknown): Record<string, string> {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return {};
    }

    const errors: Record<string, string> = {};
    for (const [key, val] of Object.entries(data)) {
        if (Array.isArray(val) && val[0]) {
            errors[key] = String(val[0]);
        } else if (typeof val === 'string') {
            errors[key] = val;
        }
    }

    return errors;
}

export default function RecordPaymentForm({
    invoiceId,
    invoicePaymentId,
    lockedInvoice,
    onSuccess,
    onCancel,
    showCancelLink = false,
}: {
    invoiceId?: number | null;
    invoicePaymentId?: number;
    lockedInvoice?: LockedPaymentInvoice | null;
    onSuccess?: () => void;
    onCancel?: () => void;
    showCancelLink?: boolean;
}) {
    const isEdit = Boolean(invoicePaymentId);
    const fixedInvoice = lockedInvoice ?? null;
    const resolvedInvoiceId = fixedInvoice?.id ?? invoiceId ?? null;

    const [parties, setParties] = useState<Pick<Party, 'id' | 'name'>[]>([]);
    const [openInvoices, setOpenInvoices] = useState<OpenInvoiceOption[]>([]);
    const [paymentModes, setPaymentModes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof PaymentFormData, string>>>({});
    const [data, setData] = useState<PaymentFormData>({
        party_id: '',
        freight_invoice_id: resolvedInvoiceId ? String(resolvedInvoiceId) : '',
        payment_date: new Date().toISOString().slice(0, 10),
        amount: '',
        payment_mode: 'neft',
        reference_no: '',
        notes: '',
    });

    const loadMeta = useCallback(
        async (partyId?: string, freightInvoiceId?: string) => {
            const payload: Record<string, string | number> = {};
            if (partyId) {
                payload.party_id = partyId;
            }
            if (freightInvoiceId) {
                payload.freight_invoice_id = freightInvoiceId;
            }

            const res = await appApiPost<ApiEnvelope<InvoicePaymentMetaData>>(
                '/invoice-payments/invoice-payment-meta',
                payload,
            );

            if (!res.success || !res.data) {
                throw new Error(res.message || 'Could not load form data.');
            }

            setParties(res.data.parties);
            setOpenInvoices(res.data.openInvoices);
            setPaymentModes(res.data.paymentModes);
        },
        [],
    );

    useEffect(() => {
        setLoading(true);
        setLoadError(null);

        const load = async () => {
            try {
                if (invoicePaymentId) {
                    const res = await appApiPost<ApiEnvelope<InvoicePaymentShowData>>(
                        '/invoice-payments/invoice-payment-show',
                        { id: invoicePaymentId },
                    );

                    if (!res.success || !res.data?.invoicePayment) {
                        setLoadError(res.message || 'Could not load payment.');
                        return;
                    }

                    const row = res.data.invoicePayment;
                    setParties(res.data.parties);
                    setOpenInvoices(res.data.openInvoices);
                    setPaymentModes(res.data.paymentModes);
                    setData({
                        party_id: String(row.party_id),
                        freight_invoice_id: String(row.freight_invoice_id),
                        payment_date: dateInputValue(row.payment_date),
                        amount: String(row.amount),
                        payment_mode: row.payment_mode ?? 'neft',
                        reference_no: row.reference_no ?? '',
                        notes: row.notes ?? '',
                    });
                } else {
                    await loadMeta(
                        undefined,
                        resolvedInvoiceId ? String(resolvedInvoiceId) : undefined,
                    );

                    if (resolvedInvoiceId) {
                        setData((prev) => ({
                            ...prev,
                            freight_invoice_id: String(resolvedInvoiceId),
                        }));
                    }
                }
            } catch {
                setLoadError('Could not load form data.');
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [invoicePaymentId, resolvedInvoiceId, loadMeta]);

    useEffect(() => {
        if (invoicePaymentId || !resolvedInvoiceId || openInvoices.length === 0) {
            return;
        }

        const invoice = openInvoices.find((inv) => inv.id === resolvedInvoiceId);
        if (!invoice) {
            return;
        }

        setData((prev) => ({
            ...prev,
            party_id: String(invoice.party_id),
            freight_invoice_id: String(resolvedInvoiceId),
        }));
    }, [openInvoices, resolvedInvoiceId, invoicePaymentId]);

    const selectedInvoice = useMemo(() => {
        if (fixedInvoice) {
            const fromMeta = openInvoices.find((inv) => inv.id === fixedInvoice.id);
            if (fromMeta) {
                return fromMeta;
            }

            return {
                id: fixedInvoice.id,
                bill_number: fixedInvoice.bill_number,
                party_id: 0,
                party_name: fixedInvoice.party_name ?? '',
                balance_amount: Number(fixedInvoice.balance_amount),
                received: Number(fixedInvoice.received ?? 0),
                outstanding: Number(fixedInvoice.outstanding ?? fixedInvoice.balance_amount),
            } satisfies OpenInvoiceOption;
        }

        return openInvoices.find((inv) => String(inv.id) === data.freight_invoice_id);
    }, [fixedInvoice, openInvoices, data.freight_invoice_id]);

    const maxAmount = useMemo(() => {
        if (!selectedInvoice) {
            return null;
        }

        if (isEdit && invoicePaymentId) {
            return selectedInvoice.outstanding + Number(data.amount || 0);
        }

        return selectedInvoice.outstanding;
    }, [selectedInvoice, isEdit, invoicePaymentId, data.amount]);

    const setField = (field: keyof PaymentFormData, value: string) => {
        setData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const onPartyChange = async (partyId: string) => {
        setField('party_id', partyId);
        setField('freight_invoice_id', '');

        try {
            await loadMeta(partyId || undefined);
        } catch {
            setLoadError('Could not load invoices for party.');
        }
    };

    const onInvoiceChange = (invoiceIdValue: string) => {
        setField('freight_invoice_id', invoiceIdValue);

        const invoice = openInvoices.find((inv) => String(inv.id) === invoiceIdValue);
        if (invoice) {
            setField('party_id', String(invoice.party_id));
        }
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoadError(null);

        const clientErrors: Partial<Record<keyof PaymentFormData, string>> = {};

        if (!data.freight_invoice_id) {
            clientErrors.freight_invoice_id = 'Select an invoice.';
        }
        if (!data.payment_date) {
            clientErrors.payment_date = 'Payment date is required.';
        }
        if (!data.amount || Number(data.amount) <= 0) {
            clientErrors.amount = 'Enter a valid amount.';
        } else if (maxAmount !== null && Number(data.amount) > maxAmount) {
            clientErrors.amount = `Amount cannot exceed outstanding (₹ ${formatMoney(maxAmount)}).`;
        }

        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            return;
        }

        setProcessing(true);

        try {
            const payload = {
                freight_invoice_id: Number(data.freight_invoice_id),
                payment_date: data.payment_date,
                amount: Number(data.amount),
                payment_mode: data.payment_mode || null,
                reference_no: data.reference_no || null,
                notes: data.notes || null,
                ...(invoicePaymentId ? { id: invoicePaymentId } : {}),
            };

            const res = await appApiPost<ApiEnvelope<{ invoicePayment: InvoicePayment }>>(
                invoicePaymentId
                    ? '/invoice-payments/invoice-payment-update'
                    : '/invoice-payments/invoice-payment-store',
                payload,
            );

            if (!res.success) {
                setErrors(apiFieldErrors(res.data));
                if (!res.data) {
                    setLoadError(res.message || 'Could not save payment.');
                }
                return;
            }

            if (onSuccess) {
                onSuccess();
            } else {
                router.visit(route('invoice-payments.index'));
            }
        } catch {
            setLoadError('Could not save payment.');
        } finally {
            setProcessing(false);
        }
    };

    const inputClass = (field: keyof PaymentFormData) =>
        `mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
            errors[field] ? 'border-red-300' : ''
        }`;

    if (loading) {
        return <p className="py-6 text-center text-sm text-gray-500">Loading…</p>;
    }

    return (
        <>
            {loadError && (
                <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {loadError}
                </p>
            )}

            <form onSubmit={submit} className="space-y-5">
                {fixedInvoice ? (
                    <div className="rounded-lg bg-gray-50 p-4 text-sm">
                        <p className="font-medium text-gray-900">{fixedInvoice.bill_number}</p>
                        {fixedInvoice.party_name && (
                            <p className="mt-1 text-gray-600">{fixedInvoice.party_name}</p>
                        )}
                        {selectedInvoice && (
                            <dl className="mt-3 grid gap-2 sm:grid-cols-3">
                                <div>
                                    <dt className="text-gray-500">Balance due</dt>
                                    <dd className="font-medium">
                                        ₹ {formatMoney(selectedInvoice.balance_amount)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Already received</dt>
                                    <dd className="font-medium text-green-700">
                                        ₹ {formatMoney(selectedInvoice.received)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Outstanding</dt>
                                    <dd className="font-semibold text-indigo-700">
                                        ₹ {formatMoney(selectedInvoice.outstanding)}
                                    </dd>
                                </div>
                            </dl>
                        )}
                    </div>
                ) : (
                    <>
                        <div>
                            <InputLabel value="Party (filter invoices)" />
                            <select
                                className={inputClass('party_id')}
                                value={data.party_id}
                                onChange={(e) => void onPartyChange(e.target.value)}
                            >
                                <option value="">All parties</option>
                                {parties.map((party) => (
                                    <option key={party.id} value={party.id}>
                                        {party.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <InputLabel value="Invoice" />
                            <select
                                className={inputClass('freight_invoice_id')}
                                value={data.freight_invoice_id}
                                onChange={(e) => onInvoiceChange(e.target.value)}
                                required
                            >
                                <option value="">Select invoice</option>
                                {openInvoices.map((invoice) => (
                                    <option key={invoice.id} value={invoice.id}>
                                        {invoice.bill_number} — {invoice.party_name} (outstanding ₹{' '}
                                        {formatMoney(invoice.outstanding)})
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.freight_invoice_id} className="mt-1" />
                        </div>

                        {selectedInvoice && (
                            <div className="rounded-lg bg-gray-50 p-4 text-sm">
                                <dl className="grid gap-2 sm:grid-cols-3">
                                    <div>
                                        <dt className="text-gray-500">Balance due</dt>
                                        <dd className="font-medium">
                                            ₹ {formatMoney(selectedInvoice.balance_amount)}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Already received</dt>
                                        <dd className="font-medium text-green-700">
                                            ₹ {formatMoney(selectedInvoice.received)}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Outstanding</dt>
                                        <dd className="font-semibold text-indigo-700">
                                            ₹ {formatMoney(selectedInvoice.outstanding)}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        )}
                    </>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                        <InputLabel value="Payment date" />
                        <TextInput
                            type="date"
                            className={inputClass('payment_date')}
                            value={data.payment_date}
                            onChange={(e) => setField('payment_date', e.target.value)}
                            required
                        />
                        <InputError message={errors.payment_date} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel value="Amount" />
                        <TextInput
                            type="number"
                            min="0.01"
                            step="0.01"
                            className={inputClass('amount')}
                            value={data.amount}
                            onChange={(e) => setField('amount', e.target.value)}
                            required
                        />
                        <InputError message={errors.amount} className="mt-1" />
                    </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                        <InputLabel value="Payment mode" />
                        <select
                            className={inputClass('payment_mode')}
                            value={data.payment_mode}
                            onChange={(e) => setField('payment_mode', e.target.value)}
                        >
                            {paymentModes.map((mode) => (
                                <option key={mode} value={mode}>
                                    {mode.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <InputLabel value="Reference no." />
                        <TextInput
                            className={inputClass('reference_no')}
                            value={data.reference_no}
                            onChange={(e) => setField('reference_no', e.target.value)}
                            placeholder="UTR / cheque no."
                        />
                    </div>
                </div>

                <div>
                    <InputLabel value="Notes" />
                    <textarea
                        className={`${inputClass('notes')} min-h-[80px]`}
                        value={data.notes}
                        onChange={(e) => setField('notes', e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <PrimaryButton disabled={processing}>
                        {isEdit ? 'Update Payment' : 'Save Payment'}
                    </PrimaryButton>
                    {onCancel && (
                        <SecondaryButton type="button" onClick={onCancel}>
                            Cancel
                        </SecondaryButton>
                    )}
                    {showCancelLink && !onCancel && (
                        <Link
                            href={route('invoice-payments.index')}
                            className="text-sm text-gray-600 hover:text-gray-900"
                        >
                            Cancel
                        </Link>
                    )}
                </div>
            </form>
        </>
    );
}
