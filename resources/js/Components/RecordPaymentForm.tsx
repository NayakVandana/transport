import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { apiFieldErrors, fieldInputClass, hasApiFieldErrors } from '@/lib/apiFormErrors';
import { formatMoney } from '@/lib/freightCalculator';
import {
    validateInvoicePaymentForm,
    type InvoicePaymentFormData,
} from '@/lib/invoicePaymentValidation';
import type {
    InvoicePayment,
    InvoicePaymentSummary,
    OpenInvoiceOption,
    Party,
} from '@/types/transport';
import { Link, router } from '@inertiajs/react';
import { FormEventHandler, useCallback, useEffect, useMemo, useState } from 'react';

function matchOpenInvoice(
    openInvoices: OpenInvoiceOption[],
    billNumber: string,
    partyId?: string,
): OpenInvoiceOption | undefined {
    const normalized = billNumber.trim().toLowerCase();
    if (!normalized) {
        return undefined;
    }

    return openInvoices.find(
        (inv) =>
            inv.bill_number.toLowerCase() === normalized &&
            (!partyId || String(inv.party_id) === partyId),
    );
}


type PaymentFormData = InvoicePaymentFormData;

type InvoicePaymentMetaData = {
    parties: Pick<Party, 'id' | 'name'>[];
    openInvoices: OpenInvoiceOption[];
    invoiceSummary?: InvoicePaymentSummary | null;
    paymentModes: string[];
};

export type LockedPaymentParty = {
    id: number;
    name: string;
    balance_due: number | string;
    received: number | string;
    outstanding: number | string;
};

export type LockedPaymentInvoice = {
    id: number;
    bill_number: string;
    party_id: number;
    balance_amount: number | string;
    received: number | string;
    outstanding: number | string;
};

export default function RecordPaymentForm({
    partyId,
    invoiceId,
    lockedParty,
    lockedInvoice,
    onSuccess,
    onCancel,
    showCancelLink = false,
}: {
    partyId?: number | null;
    invoiceId?: number | null;
    lockedParty?: LockedPaymentParty | null;
    lockedInvoice?: LockedPaymentInvoice | null;
    onSuccess?: () => void;
    onCancel?: () => void;
    showCancelLink?: boolean;
}) {
    const fixedParty = lockedParty ?? null;
    const fixedInvoice = lockedInvoice ?? null;
    const resolvedPartyId = fixedParty?.id ?? fixedInvoice?.party_id ?? partyId ?? null;
    const resolvedInvoiceId = fixedInvoice?.id ?? invoiceId ?? null;

    const [parties, setParties] = useState<Pick<Party, 'id' | 'name'>[]>([]);
    const [openInvoices, setOpenInvoices] = useState<OpenInvoiceOption[]>([]);
    const [invoiceSummary, setInvoiceSummary] = useState<InvoicePaymentSummary | null>(null);
    const [paymentModes, setPaymentModes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof PaymentFormData, string>>>({});
    const [data, setData] = useState<PaymentFormData>({
        party_id: resolvedPartyId ? String(resolvedPartyId) : '',
        freight_invoice_id: resolvedInvoiceId ? String(resolvedInvoiceId) : '',
        bill_number: fixedInvoice?.bill_number ?? '',
        payment_date: new Date().toISOString().slice(0, 10),
        amount: '',
        payment_mode: 'neft',
        reference_no: '',
        notes: '',
    });

    const loadMeta = useCallback(
        async (options?: {
            partyId?: string;
            invoiceId?: string;
            billNumber?: string;
        }) => {
            const payload: Record<string, string | number> = {};
            if (options?.partyId) {
                payload.party_id = options.partyId;
            }
            if (options?.invoiceId) {
                payload.freight_invoice_id = options.invoiceId;
            }
            if (options?.billNumber?.trim()) {
                payload.bill_number = options.billNumber.trim();
            }

            const res = await appApiPost<ApiEnvelope<InvoicePaymentMetaData>>(
                '/invoice-payments/invoice-payment-meta',
                payload,
            );

            if (!res.success || !res.data) {
                throw new Error(res.message || 'Could not load form data.');
            }

            setParties(res.data.parties);
            setOpenInvoices(res.data.openInvoices ?? []);
            setInvoiceSummary(res.data.invoiceSummary ?? null);
            setPaymentModes(res.data.paymentModes);

            return res.data;
        },
        [],
    );

    useEffect(() => {
        setLoading(true);
        setLoadError(null);

        const load = async () => {
            try {
                const partyKey = resolvedPartyId ? String(resolvedPartyId) : undefined;
                const invoiceKey = resolvedInvoiceId ? String(resolvedInvoiceId) : undefined;
                const meta = await loadMeta({
                    partyId: partyKey,
                    invoiceId: invoiceKey,
                    billNumber: fixedInvoice?.bill_number,
                });

                const matchedInvoice = invoiceKey
                    ? meta.openInvoices.find((inv) => String(inv.id) === invoiceKey)
                    : undefined;

                setData((prev) => ({
                    ...prev,
                    party_id:
                        partyKey ??
                        (matchedInvoice ? String(matchedInvoice.party_id) : prev.party_id),
                    freight_invoice_id: invoiceKey ?? prev.freight_invoice_id,
                    bill_number:
                        fixedInvoice?.bill_number ??
                        matchedInvoice?.bill_number ??
                        prev.bill_number,
                }));
            } catch {
                setLoadError('Could not load form data.');
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [resolvedPartyId, resolvedInvoiceId, fixedInvoice?.bill_number, loadMeta]);

    const billOptions = useMemo(() => {
        const partyFilter = data.party_id || (fixedParty ? String(fixedParty.id) : '');

        if (!partyFilter) {
            return openInvoices;
        }

        return openInvoices.filter((inv) => String(inv.party_id) === partyFilter);
    }, [openInvoices, data.party_id, fixedParty]);

    const selectedOpenInvoice = useMemo(
        () =>
            openInvoices.find((inv) => String(inv.id) === data.freight_invoice_id) ??
            matchOpenInvoice(openInvoices, data.bill_number, data.party_id || undefined),
        [openInvoices, data.freight_invoice_id, data.bill_number, data.party_id],
    );

    const activeInvoiceSummary = useMemo((): InvoicePaymentSummary | null => {
        if (fixedInvoice) {
            return {
                received: Number(fixedInvoice.received),
                outstanding: Number(fixedInvoice.outstanding),
                payment_status:
                    Number(fixedInvoice.outstanding) <= 0
                        ? 'paid'
                        : Number(fixedInvoice.received) > 0
                          ? 'partial'
                          : 'pending',
            };
        }

        if (invoiceSummary) {
            return invoiceSummary;
        }

        if (selectedOpenInvoice) {
            return {
                received: selectedOpenInvoice.received,
                outstanding: selectedOpenInvoice.outstanding,
                payment_status:
                    selectedOpenInvoice.outstanding <= 0
                        ? 'paid'
                        : selectedOpenInvoice.received > 0
                          ? 'partial'
                          : 'pending',
            };
        }

        return null;
    }, [fixedInvoice, invoiceSummary, selectedOpenInvoice]);

    const maxAmount = useMemo(() => {
        if (!activeInvoiceSummary) {
            return null;
        }

        return activeInvoiceSummary.outstanding;
    }, [activeInvoiceSummary]);

    const setField = (field: keyof PaymentFormData, value: string) => {
        setData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const onPartyChange = async (nextPartyId: string) => {
        setData((prev) => ({
            ...prev,
            party_id: nextPartyId,
            freight_invoice_id: '',
            bill_number: '',
        }));
        setInvoiceSummary(null);

        try {
            await loadMeta({ partyId: nextPartyId || undefined });
        } catch {
            setLoadError('Could not load bills for this party.');
        }
    };

    const urlLockedParty = Boolean(resolvedPartyId && !fixedParty && !fixedInvoice);
    const activePartyId =
        data.party_id ||
        (fixedParty ? String(fixedParty.id) : '') ||
        (resolvedPartyId ? String(resolvedPartyId) : '');
    const activePartyName =
        fixedParty?.name ??
        parties.find((party) => String(party.id) === activePartyId)?.name ??
        selectedOpenInvoice?.party_name ??
        '';

    const onBillSelect = async (nextInvoiceId: string) => {
        const invoice = billOptions.find((inv) => String(inv.id) === nextInvoiceId);

        setData((prev) => ({
            ...prev,
            freight_invoice_id: nextInvoiceId,
            bill_number: invoice?.bill_number ?? '',
            party_id: invoice ? String(invoice.party_id) : prev.party_id,
        }));

        if (!invoice) {
            setInvoiceSummary(null);
            return;
        }

        try {
            await loadMeta({
                partyId: String(invoice.party_id),
                invoiceId: String(invoice.id),
                billNumber: invoice.bill_number,
            });
        } catch {
            setLoadError('Could not load bill details.');
        }
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoadError(null);

        const clientErrors = validateInvoicePaymentForm(data, maxAmount, formatMoney);
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            return;
        }

        setProcessing(true);

        try {
            const payload = {
                party_id: Number(data.party_id),
                freight_invoice_id: data.freight_invoice_id
                    ? Number(data.freight_invoice_id)
                    : null,
                bill_number: data.bill_number.trim() || null,
                payment_date: data.payment_date,
                amount: Number(data.amount),
                payment_mode: data.payment_mode || null,
                reference_no: data.reference_no || null,
                notes: data.notes || null,
            };

            const res = await appApiPost<ApiEnvelope<{ invoicePayment: InvoicePayment }>>(
                '/invoice-payments/invoice-payment-store',
                payload,
            );

            if (!res.success) {
                setErrors(apiFieldErrors(res.data));
                if (!hasApiFieldErrors(res.data)) {
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
        fieldInputClass(
            Boolean(errors[field]),
            'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500',
        );

    const selectedBillNumber =
        fixedInvoice?.bill_number ??
        data.bill_number ??
        selectedOpenInvoice?.bill_number ??
        '';

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
                        <p className="font-mono font-semibold text-gray-900">
                            {fixedInvoice.bill_number}
                        </p>
                        <p className="mt-1 text-gray-600">Bill (tax invoice)</p>
                        <dl className="mt-3 grid gap-2 sm:grid-cols-3">
                            <div>
                                <dt className="text-gray-500">Balance due</dt>
                                <dd className="font-medium">
                                    ₹ {formatMoney(fixedInvoice.balance_amount)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Already received</dt>
                                <dd className="font-medium text-green-700">
                                    ₹ {formatMoney(fixedInvoice.received)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Outstanding</dt>
                                <dd className="font-semibold text-indigo-700">
                                    ₹ {formatMoney(fixedInvoice.outstanding)}
                                </dd>
                            </div>
                        </dl>
                    </div>
                ) : (
                    <>
                        {fixedParty || urlLockedParty ? (
                            <div className="rounded-lg bg-gray-50 p-4 text-sm">
                                <p className="font-medium text-gray-900">{activePartyName}</p>
                                <p className="mt-1 text-gray-600">Party (receiver)</p>
                            </div>
                        ) : (
                            <div>
                                <InputLabel value="Party (receiver)" />
                                <select
                                    className={inputClass('party_id')}
                                    value={data.party_id}
                                    onChange={(e) => void onPartyChange(e.target.value)}
                                >
                                    <option value="">Select party</option>
                                    {parties.map((party) => (
                                        <option key={party.id} value={party.id}>
                                            {party.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.party_id} className="mt-1" />
                            </div>
                        )}

                        <div>
                            <InputLabel value="Bill No." />
                            <select
                                className={`${inputClass('freight_invoice_id')} font-mono`}
                                value={data.freight_invoice_id}
                                onChange={(e) => void onBillSelect(e.target.value)}
                                disabled={!activePartyId}
                            >
                                <option value="">Select bill</option>
                                {billOptions.map((inv) => (
                                    <option key={inv.id} value={inv.id}>
                                        {inv.bill_number} — received ₹ {formatMoney(inv.received)} —
                                        outstanding ₹ {formatMoney(inv.outstanding)}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={errors.freight_invoice_id ?? errors.bill_number}
                                className="mt-1"
                            />
                            {!activePartyId && (
                                <p className="mt-1 text-xs text-gray-500">
                                    Select a party first to see open bills.
                                </p>
                            )}
                            {activePartyId && billOptions.length === 0 && (
                                <p className="mt-1 text-xs text-amber-700">
                                    No bills with outstanding balance for this party.
                                </p>
                            )}
                        </div>
                    </>
                )}

                {activeInvoiceSummary &&
                    data.freight_invoice_id &&
                    !fixedInvoice &&
                    selectedOpenInvoice && (
                    <div className="rounded-lg bg-gray-50 p-4 text-sm">
                        <p className="font-mono font-semibold text-gray-900">{selectedBillNumber}</p>
                        <p className="mt-1 text-gray-600">
                            Payment is recorded against this bill only.
                            {activePartyName ? ` · ${activePartyName}` : ''}
                        </p>
                        <dl className="mt-3 grid gap-2 sm:grid-cols-3">
                            <div>
                                <dt className="text-gray-500">Balance due</dt>
                                <dd className="font-medium">
                                    ₹ {formatMoney(selectedOpenInvoice.balance_amount)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Already received</dt>
                                <dd className="font-medium text-green-700">
                                    ₹ {formatMoney(activeInvoiceSummary.received)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Bill outstanding</dt>
                                <dd className="font-semibold text-indigo-700">
                                    ₹ {formatMoney(activeInvoiceSummary.outstanding)}
                                </dd>
                            </div>
                        </dl>
                    </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                        <InputLabel value="Payment date" />
                        <TextInput
                            type="date"
                            className={inputClass('payment_date')}
                            value={data.payment_date}
                            onChange={(e) => setField('payment_date', e.target.value)}
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
                        <InputError message={errors.reference_no} className="mt-1" />
                    </div>
                </div>

                <div>
                    <InputLabel value="Notes" />
                    <textarea
                        className={`${inputClass('notes')} min-h-[80px]`}
                        value={data.notes}
                        onChange={(e) => setField('notes', e.target.value)}
                    />
                    <InputError message={errors.notes} className="mt-1" />
                </div>

                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap sm:items-center [&_a]:w-full sm:[&_a]:w-auto [&_button]:w-full sm:[&_button]:w-auto">
                    <PrimaryButton disabled={processing}>Save Payment</PrimaryButton>
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
