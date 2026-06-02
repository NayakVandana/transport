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
import type { InvoicePayment, Party, PartyPaymentSummary } from '@/types/transport';
import { Link, router } from '@inertiajs/react';
import { FormEventHandler, useCallback, useEffect, useMemo, useState } from 'react';

function dateInputValue(value?: string | null): string {
    return value?.slice(0, 10) ?? '';
}

type PaymentFormData = InvoicePaymentFormData;

type InvoicePaymentMetaData = {
    parties: Pick<Party, 'id' | 'name'>[];
    partySummary: PartyPaymentSummary | null;
    paymentModes: string[];
};

type InvoicePaymentShowData = InvoicePaymentMetaData & {
    invoicePayment: InvoicePayment;
};

export type LockedPaymentParty = {
    id: number;
    name: string;
    balance_due: number | string;
    received: number | string;
    outstanding: number | string;
};

export default function RecordPaymentForm({
    partyId,
    invoicePaymentId,
    lockedParty,
    onSuccess,
    onCancel,
    showCancelLink = false,
}: {
    partyId?: number | null;
    invoicePaymentId?: number;
    lockedParty?: LockedPaymentParty | null;
    onSuccess?: () => void;
    onCancel?: () => void;
    showCancelLink?: boolean;
}) {
    const isEdit = Boolean(invoicePaymentId);
    const fixedParty = lockedParty ?? null;
    const resolvedPartyId = fixedParty?.id ?? partyId ?? null;
    const partyLocked = Boolean(fixedParty || resolvedPartyId);

    const [parties, setParties] = useState<Pick<Party, 'id' | 'name'>[]>([]);
    const [partySummary, setPartySummary] = useState<PartyPaymentSummary | null>(null);
    const [paymentModes, setPaymentModes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof PaymentFormData, string>>>({});
    const [data, setData] = useState<PaymentFormData>({
        party_id: resolvedPartyId ? String(resolvedPartyId) : '',
        payment_date: new Date().toISOString().slice(0, 10),
        amount: '',
        payment_mode: 'neft',
        reference_no: '',
        notes: '',
    });

    const loadMeta = useCallback(async (selectedPartyId?: string) => {
        const payload: Record<string, string | number> = {};
        if (selectedPartyId) {
            payload.party_id = selectedPartyId;
        }

        const res = await appApiPost<ApiEnvelope<InvoicePaymentMetaData>>(
            '/invoice-payments/invoice-payment-meta',
            payload,
        );

        if (!res.success || !res.data) {
            throw new Error(res.message || 'Could not load form data.');
        }

        setParties(res.data.parties);
        setPartySummary(res.data.partySummary);
        setPaymentModes(res.data.paymentModes);
    }, []);

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
                    setPartySummary(res.data.partySummary);
                    setPaymentModes(res.data.paymentModes);
                    setData({
                        party_id: String(row.party_id),
                        payment_date: dateInputValue(row.payment_date),
                        amount: String(row.amount),
                        payment_mode: row.payment_mode ?? 'neft',
                        reference_no: row.reference_no ?? '',
                        notes: row.notes ?? '',
                    });

                    if (!res.data.partySummary) {
                        await loadMeta(String(row.party_id));
                    }
                } else {
                    await loadMeta(resolvedPartyId ? String(resolvedPartyId) : undefined);

                    setData((prev) => ({
                        ...prev,
                        party_id: resolvedPartyId ? String(resolvedPartyId) : prev.party_id,
                    }));
                }
            } catch {
                setLoadError('Could not load form data.');
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [invoicePaymentId, resolvedPartyId, loadMeta]);

    const activePartySummary = useMemo((): PartyPaymentSummary | null => {
        if (fixedParty) {
            return {
                balance_due: Number(fixedParty.balance_due),
                received: Number(fixedParty.received),
                outstanding: Number(fixedParty.outstanding),
            };
        }

        return partySummary;
    }, [fixedParty, partySummary]);

    const maxAmount = useMemo(() => {
        if (!activePartySummary) {
            return null;
        }

        if (isEdit && invoicePaymentId) {
            return activePartySummary.outstanding + Number(data.amount || 0);
        }

        return activePartySummary.outstanding;
    }, [activePartySummary, isEdit, invoicePaymentId, data.amount]);

    const setField = (field: keyof PaymentFormData, value: string) => {
        setData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const onPartyChange = async (nextPartyId: string) => {
        setField('party_id', nextPartyId);

        try {
            await loadMeta(nextPartyId || undefined);
        } catch {
            setLoadError('Could not load party outstanding.');
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

    const selectedPartyName =
        parties.find((party) => String(party.id) === data.party_id)?.name ??
        fixedParty?.name ??
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
                {fixedParty ? (
                    <div className="rounded-lg bg-gray-50 p-4 text-sm">
                        <p className="font-medium text-gray-900">{fixedParty.name}</p>
                        <p className="mt-1 text-gray-600">Party account (receiver)</p>
                        <dl className="mt-3 grid gap-2 sm:grid-cols-3">
                            <div>
                                <dt className="text-gray-500">Balance due</dt>
                                <dd className="font-medium">
                                    ₹ {formatMoney(fixedParty.balance_due)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Already received</dt>
                                <dd className="font-medium text-green-700">
                                    ₹ {formatMoney(fixedParty.received)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Outstanding</dt>
                                <dd className="font-semibold text-indigo-700">
                                    ₹ {formatMoney(fixedParty.outstanding)}
                                </dd>
                            </div>
                        </dl>
                    </div>
                ) : (
                    <div>
                        <InputLabel value="Party (receiver)" />
                        <select
                            className={inputClass('party_id')}
                            value={data.party_id}
                            onChange={(e) => void onPartyChange(e.target.value)}
                            disabled={partyLocked && Boolean(resolvedPartyId) && !isEdit}
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

                {activePartySummary && data.party_id && !fixedParty && (
                    <div className="rounded-lg bg-gray-50 p-4 text-sm">
                        <p className="font-medium text-gray-900">{selectedPartyName}</p>
                        <p className="mt-1 text-gray-600">
                            Payment is recorded against the party account, not a specific bill.
                        </p>
                        <dl className="mt-3 grid gap-2 sm:grid-cols-3">
                            <div>
                                <dt className="text-gray-500">Balance due</dt>
                                <dd className="font-medium">
                                    ₹ {formatMoney(activePartySummary.balance_due)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Already received</dt>
                                <dd className="font-medium text-green-700">
                                    ₹ {formatMoney(activePartySummary.received)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Outstanding</dt>
                                <dd className="font-semibold text-indigo-700">
                                    ₹ {formatMoney(activePartySummary.outstanding)}
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
