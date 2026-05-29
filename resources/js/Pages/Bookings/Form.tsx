import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { usePageHeader } from '@/hooks/usePageHeader';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import {
    validateBookingForm,
    type BookingFormData,
    type BookingValidationMessages,
} from '@/lib/bookingValidation';
import { calculateBookingBalance, formatMoney } from '@/lib/freightCalculator';
import type { Booking, Vehicle } from '@/types/transport';
import { Head, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

function dateInputValue(value?: string | null): string {
    return value?.slice(0, 10) ?? '';
}

type BookingShowData = {
    booking: Booking;
    vehicles: Pick<Vehicle, 'id' | 'vehicle_number'>[];
    validationMessages: BookingValidationMessages;
};

type BookingMetaData = {
    vehicles: Pick<Vehicle, 'id' | 'vehicle_number'>[];
    validationMessages: BookingValidationMessages;
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

export default function BookingForm({ bookingId }: { bookingId?: number }) {
    const isEdit = Boolean(bookingId);

    usePageHeader(
        <h2 className="text-xl font-semibold text-gray-800">
            {isEdit ? 'Edit Booking' : 'Add Booking'}
        </h2>,
    );

    const [vehicles, setVehicles] = useState<Pick<Vehicle, 'id' | 'vehicle_number'>[]>([]);
    const [validationMessages, setValidationMessages] = useState<BookingValidationMessages>({});
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({});
    const [data, setData] = useState<BookingFormData>({
        booking_date: new Date().toISOString().slice(0, 10),
        vehicle_id: '',
        freight: '',
        advance: '0',
        empty_charge: '0',
        maintenance: '0',
    });

    useEffect(() => {
        setLoading(true);
        setLoadError(null);

        const load = async () => {
            try {
                if (bookingId) {
                    const res = await appApiPost<ApiEnvelope<BookingShowData>>(
                        '/bookings/booking-show',
                        { id: bookingId },
                    );

                    if (!res.success || !res.data?.booking) {
                        setLoadError(res.message || 'Could not load booking.');
                        return;
                    }

                    const booking = res.data.booking;
                    setVehicles(res.data.vehicles);
                    setValidationMessages(res.data.validationMessages);
                    setData({
                        booking_date: dateInputValue(booking.booking_date),
                        vehicle_id: booking.vehicle_id ? String(booking.vehicle_id) : '',
                        freight: booking.freight != null ? String(booking.freight) : '',
                        advance: booking.advance != null ? String(booking.advance) : '0',
                        empty_charge:
                            booking.empty_charge != null ? String(booking.empty_charge) : '0',
                        maintenance:
                            booking.maintenance != null ? String(booking.maintenance) : '0',
                    });
                } else {
                    const res = await appApiPost<ApiEnvelope<BookingMetaData>>(
                        '/bookings/booking-meta',
                        {},
                    );

                    if (!res.success || !res.data) {
                        setLoadError(res.message || 'Could not load form data.');
                        return;
                    }

                    setVehicles(res.data.vehicles);
                    setValidationMessages(res.data.validationMessages);
                }
            } catch {
                setLoadError('Could not load form data.');
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [bookingId]);

    const balance = useMemo(
        () =>
            calculateBookingBalance(
                data.freight,
                data.advance,
                data.empty_charge,
                data.maintenance,
            ),
        [data.freight, data.advance, data.empty_charge, data.maintenance],
    );

    const setField = (field: keyof BookingFormData, value: string) => {
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

        const clientErrors = validateBookingForm(data, validationMessages);
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            return;
        }

        setProcessing(true);

        try {
            const payload = {
                ...data,
                vehicle_id: Number(data.vehicle_id),
                freight: Number(data.freight),
                advance: Number(data.advance),
                empty_charge: Number(data.empty_charge),
                maintenance: Number(data.maintenance),
                ...(bookingId ? { id: bookingId } : {}),
            };

            const res = await appApiPost<ApiEnvelope<{ booking: Booking }>>(
                bookingId ? '/bookings/booking-update' : '/bookings/booking-store',
                payload,
            );

            if (!res.success) {
                setErrors(apiFieldErrors(res.data));
                if (!res.data) {
                    setLoadError(res.message || 'Could not save booking.');
                }
                return;
            }

            router.visit(route('bookings.index'));
        } catch {
            setLoadError('Could not save booking.');
        } finally {
            setProcessing(false);
        }
    };

    const inputClass = (field: keyof BookingFormData) =>
        `mt-1 block w-full${errors[field] ? ' border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`;

    const selectClass = errors.vehicle_id
        ? 'mt-1 block w-full rounded-md border-red-500 shadow-sm focus:border-red-500 focus:ring-red-500'
        : 'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

    return (
        <>
            <Head title={isEdit ? 'Edit Booking' : 'Add Booking'} />

            <div className="py-8">
                <div className="mx-auto max-w-xl sm:px-6 lg:px-8">
                    {loading ? (
                        <p className="text-center text-sm text-gray-500">Loading…</p>
                    ) : loadError ? (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {loadError}
                        </p>
                    ) : (
                        <form
                            onSubmit={submit}
                            noValidate
                            className="space-y-4 rounded-lg bg-white p-6 shadow"
                        >
                            <Field label="Date" required error={errors.booking_date}>
                                <TextInput
                                    type="date"
                                    className={inputClass('booking_date')}
                                    value={data.booking_date}
                                    onChange={(e) => setField('booking_date', e.target.value)}
                                />
                            </Field>

                            <Field label="Vehicle" required error={errors.vehicle_id}>
                                <select
                                    className={selectClass}
                                    value={data.vehicle_id}
                                    onChange={(e) => setField('vehicle_id', e.target.value)}
                                >
                                    <option value="">Select vehicle</option>
                                    {vehicles.map((vehicle) => (
                                        <option key={vehicle.id} value={vehicle.id}>
                                            {vehicle.vehicle_number}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Freight" required error={errors.freight}>
                                    <TextInput
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className={inputClass('freight')}
                                        value={data.freight}
                                        onChange={(e) => setField('freight', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </Field>
                                <Field label="Advance" error={errors.advance}>
                                    <TextInput
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className={inputClass('advance')}
                                        value={data.advance}
                                        onChange={(e) => setField('advance', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </Field>
                                <Field label="Empty" error={errors.empty_charge}>
                                    <TextInput
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className={inputClass('empty_charge')}
                                        value={data.empty_charge}
                                        onChange={(e) => setField('empty_charge', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </Field>
                                <Field label="Maintenance" error={errors.maintenance}>
                                    <TextInput
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className={inputClass('maintenance')}
                                        value={data.maintenance}
                                        onChange={(e) => setField('maintenance', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </Field>
                            </div>

                            <div className="rounded-md bg-gray-50 px-4 py-3">
                                <p className="text-sm text-gray-600">Balance</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    ₹ {formatMoney(balance)}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    Freight + Empty − Advance − Maintenance
                                </p>
                            </div>

                            <PrimaryButton disabled={processing}>
                                {isEdit ? 'Update Booking' : 'Add Booking'}
                            </PrimaryButton>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}

function Field({
    label,
    required = false,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <InputLabel>
                {label}
                {required && <span className="text-red-600"> *</span>}
            </InputLabel>
            {children}
            <InputError message={error} className="mt-1" />
        </div>
    );
}
