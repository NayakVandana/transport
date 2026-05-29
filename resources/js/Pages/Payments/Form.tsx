import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import { invalidateAppQuery } from '@/hooks/useAppQuery';
import { usePageHeader } from '@/hooks/usePageHeader';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import type { Booking, Customer, ExpenseOption, FreightInvoice, Payment } from '@/types/transport';
import { Head, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

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

function dateInputValue(value?: string | null): string {
    return value?.slice(0, 10) ?? '';
}

type PaymentMeta = {
    directions: ExpenseOption[];
    payment_methods: ExpenseOption[];
    customers: Pick<Customer, 'id' | 'name' | 'mobile'>[];
    bookings: (Pick<Booking, 'id' | 'booking_date' | 'balance'> & {
        vehicle?: { id: number; vehicle_number: string };
    })[];
    invoices: Pick<FreightInvoice, 'id' | 'bill_number' | 'invoice_date' | 'balance_amount'>[];
};

type PaymentShowData = PaymentMeta & {
    payment: Payment;
};

function bookingLabel(
    booking: PaymentMeta['bookings'][number],
): string {
    const date = dateInputValue(booking.booking_date);
    const vehicle = booking.vehicle?.vehicle_number;
    const balance = booking.balance != null ? ` · Bal ₹${booking.balance}` : '';

    return `${date}${vehicle ? ` · ${vehicle}` : ''}${balance}`;
}

function invoiceLabel(
    invoice: PaymentMeta['invoices'][number],
): string {
    const date = dateInputValue(invoice.invoice_date);

    return `${invoice.bill_number} · ${date} · Bal ₹${invoice.balance_amount}`;
}

export default function PaymentForm({ paymentId }: { paymentId?: number }) {
    const isEdit = Boolean(paymentId);

    usePageHeader(
        <h2 className="text-xl font-semibold text-gray-800">
            {isEdit ? 'Edit Payment' : 'Record Payment'}
        </h2>,
    );

    const [directions, setDirections] = useState<ExpenseOption[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<ExpenseOption[]>([]);
    const [customers, setCustomers] = useState<PaymentMeta['customers']>([]);
    const [bookings, setBookings] = useState<PaymentMeta['bookings']>([]);
    const [invoices, setInvoices] = useState<PaymentMeta['invoices']>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [data, setData] = useState({
        payment_date: new Date().toISOString().slice(0, 10),
        direction: 'receipt',
        amount: '',
        payment_method: 'cash',
        reference_number: '',
        notes: '',
        customer_id: '',
        booking_id: '',
        freight_invoice_id: '',
    });

    const applyMeta = (meta: PaymentMeta) => {
        setDirections(meta.directions);
        setPaymentMethods(meta.payment_methods);
        setCustomers(meta.customers);
        setBookings(meta.bookings);
        setInvoices(meta.invoices);
    };

    useEffect(() => {
        setLoading(true);
        setLoadError(null);

        const load = async () => {
            try {
                if (paymentId) {
                    const res = await appApiPost<ApiEnvelope<PaymentShowData>>(
                        '/payments/payment-show',
                        { id: paymentId },
                    );

                    if (!res.success || !res.data?.payment) {
                        setLoadError(res.message || 'Could not load payment.');
                        return;
                    }

                    applyMeta(res.data);
                    const payment = res.data.payment;
                    setData({
                        payment_date: dateInputValue(payment.payment_date),
                        direction: payment.direction,
                        amount: payment.amount != null ? String(payment.amount) : '',
                        payment_method: payment.payment_method,
                        reference_number: payment.reference_number ?? '',
                        notes: payment.notes ?? '',
                        customer_id: payment.customer_id ? String(payment.customer_id) : '',
                        booking_id: payment.booking_id ? String(payment.booking_id) : '',
                        freight_invoice_id: payment.freight_invoice_id
                            ? String(payment.freight_invoice_id)
                            : '',
                    });
                } else {
                    const res = await appApiPost<ApiEnvelope<PaymentMeta>>(
                        '/payments/payment-meta',
                        {},
                    );

                    if (!res.success || !res.data) {
                        setLoadError(res.message || 'Could not load form data.');
                        return;
                    }

                    applyMeta(res.data);
                }
            } catch {
                setLoadError('Could not load form data.');
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [paymentId]);

    const setField = (field: keyof typeof data, value: string) => {
        setData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setErrors({});
        setProcessing(true);

        try {
            const payload = {
                ...data,
                amount: Number(data.amount),
                customer_id: data.customer_id ? Number(data.customer_id) : null,
                booking_id: data.booking_id ? Number(data.booking_id) : null,
                freight_invoice_id: data.freight_invoice_id
                    ? Number(data.freight_invoice_id)
                    : null,
                reference_number: data.reference_number || null,
                notes: data.notes || null,
                ...(paymentId ? { id: paymentId } : {}),
            };

            const res = await appApiPost<ApiEnvelope<{ payment: Payment }>>(
                paymentId ? '/payments/payment-update' : '/payments/payment-store',
                payload,
            );

            if (!res.success) {
                setErrors(apiFieldErrors(res.data));
                if (!res.data) {
                    setLoadError(res.message || 'Could not save payment.');
                }
                return;
            }

            invalidateAppQuery('payments-list');
            router.visit(route('payments.index'));
        } catch {
            setLoadError('Could not save payment.');
        } finally {
            setProcessing(false);
        }
    };

    const selectClass = (field: keyof typeof data) =>
        `mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500${
            errors[field] ? ' border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        }`;

    return (
        <>
            <Head title={isEdit ? 'Edit Payment' : 'Record Payment'} />

            <div className="py-8">
                <div className="mx-auto max-w-xl sm:px-6 lg:px-8">
                    {loading ? (
                        <p className="text-center text-sm text-gray-500">Loading…</p>
                    ) : loadError ? (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {loadError}
                        </p>
                    ) : (
                        <form onSubmit={submit} className="space-y-4 rounded-lg bg-white p-6 shadow">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <InputLabel value="Date" />
                                    <input
                                        type="date"
                                        className={selectClass('payment_date')}
                                        value={data.payment_date}
                                        onChange={(e) => setField('payment_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.payment_date} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel value="Type" />
                                    <select
                                        className={selectClass('direction')}
                                        value={data.direction}
                                        onChange={(e) => setField('direction', e.target.value)}
                                        required
                                    >
                                        {directions.map((item) => (
                                            <option key={item.value} value={item.value}>
                                                {item.label}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.direction} className="mt-1" />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <InputLabel value="Amount (₹)" />
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        className={selectClass('amount')}
                                        value={data.amount}
                                        onChange={(e) => setField('amount', e.target.value)}
                                        placeholder="0.00"
                                        required
                                    />
                                    <InputError message={errors.amount} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel value="Payment method" />
                                    <select
                                        className={selectClass('payment_method')}
                                        value={data.payment_method}
                                        onChange={(e) => setField('payment_method', e.target.value)}
                                        required
                                    >
                                        {paymentMethods.map((item) => (
                                            <option key={item.value} value={item.value}>
                                                {item.label}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.payment_method} className="mt-1" />
                                </div>
                            </div>

                            <div>
                                <InputLabel value="Reference no. (optional)" />
                                <input
                                    type="text"
                                    className={selectClass('reference_number')}
                                    value={data.reference_number}
                                    onChange={(e) => setField('reference_number', e.target.value)}
                                    placeholder="UTR, cheque no., etc."
                                />
                                <InputError message={errors.reference_number} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Notes (optional)" />
                                <textarea
                                    className={selectClass('notes')}
                                    rows={3}
                                    value={data.notes}
                                    onChange={(e) => setField('notes', e.target.value)}
                                    placeholder="Additional details"
                                />
                                <InputError message={errors.notes} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Customer (optional)" />
                                <select
                                    className={selectClass('customer_id')}
                                    value={data.customer_id}
                                    onChange={(e) => setField('customer_id', e.target.value)}
                                >
                                    <option value="">None</option>
                                    {customers.map((customer) => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.name}
                                            {customer.mobile ? ` · ${customer.mobile}` : ''}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.customer_id} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Link to invoice (optional)" />
                                <select
                                    className={selectClass('freight_invoice_id')}
                                    value={data.freight_invoice_id}
                                    onChange={(e) => setField('freight_invoice_id', e.target.value)}
                                >
                                    <option value="">None</option>
                                    {invoices.map((invoice) => (
                                        <option key={invoice.id} value={invoice.id}>
                                            {invoiceLabel(invoice)}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.freight_invoice_id} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Link to booking (optional)" />
                                <select
                                    className={selectClass('booking_id')}
                                    value={data.booking_id}
                                    onChange={(e) => setField('booking_id', e.target.value)}
                                >
                                    <option value="">None</option>
                                    {bookings.map((booking) => (
                                        <option key={booking.id} value={booking.id}>
                                            {bookingLabel(booking)}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.booking_id} className="mt-1" />
                            </div>

                            <PrimaryButton disabled={processing}>
                                {isEdit ? 'Update' : 'Save'}
                            </PrimaryButton>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}
