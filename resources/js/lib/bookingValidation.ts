export type BookingFormData = {
    booking_date: string;
    vehicle_id: string;
    freight: string;
    advance: string;
    empty_charge: string;
    maintenance: string;
};

export type BookingFieldMessages = Partial<
    Record<'required' | 'numeric' | 'min' | 'date' | 'exists', string>
>;

export type BookingValidationMessages = Partial<
    Record<keyof BookingFormData, BookingFieldMessages>
>;

const DEFAULT_MESSAGES: BookingValidationMessages = {
    booking_date: {
        required: 'Please select the booking date.',
        date: 'Booking date must be a valid date.',
    },
    vehicle_id: {
        required: 'Please select a vehicle.',
        exists: 'The selected vehicle is not valid.',
    },
    freight: {
        required: 'Please enter the freight amount.',
        numeric: 'Freight must be a valid amount.',
        min: 'Freight cannot be negative.',
    },
    advance: {
        numeric: 'Advance must be a valid amount.',
        min: 'Advance cannot be negative.',
    },
    empty_charge: {
        numeric: 'Empty charge must be a valid amount.',
        min: 'Empty charge cannot be negative.',
    },
    maintenance: {
        numeric: 'Maintenance must be a valid amount.',
        min: 'Maintenance cannot be negative.',
    },
};

function messageFor(
    messages: BookingValidationMessages,
    field: keyof BookingFormData,
    rule: keyof BookingFieldMessages,
    fallback: string,
): string {
    return messages[field]?.[rule] ?? DEFAULT_MESSAGES[field]?.[rule] ?? fallback;
}

function isValidAmount(value: string): boolean {
    return value !== '' && !Number.isNaN(Number(value)) && Number(value) >= 0;
}

export function validateBookingForm(
    data: BookingFormData,
    customMessages: BookingValidationMessages = DEFAULT_MESSAGES,
): Partial<Record<keyof BookingFormData, string>> {
    const errors: Partial<Record<keyof BookingFormData, string>> = {};

    if (!data.booking_date) {
        errors.booking_date = messageFor(
            customMessages,
            'booking_date',
            'required',
            'Please select the booking date.',
        );
    }

    if (!data.vehicle_id) {
        errors.vehicle_id = messageFor(
            customMessages,
            'vehicle_id',
            'required',
            'Please select a vehicle.',
        );
    }

    if (!data.freight.trim()) {
        errors.freight = messageFor(
            customMessages,
            'freight',
            'required',
            'Please enter the freight amount.',
        );
    } else if (!isValidAmount(data.freight)) {
        errors.freight = messageFor(
            customMessages,
            'freight',
            'numeric',
            'Freight must be a valid amount.',
        );
    }

    if (data.advance.trim() && !isValidAmount(data.advance)) {
        errors.advance = messageFor(
            customMessages,
            'advance',
            'numeric',
            'Advance must be a valid amount.',
        );
    }

    if (data.empty_charge.trim() && !isValidAmount(data.empty_charge)) {
        errors.empty_charge = messageFor(
            customMessages,
            'empty_charge',
            'numeric',
            'Empty charge must be a valid amount.',
        );
    }

    if (data.maintenance.trim() && !isValidAmount(data.maintenance)) {
        errors.maintenance = messageFor(
            customMessages,
            'maintenance',
            'numeric',
            'Maintenance must be a valid amount.',
        );
    }

    return errors;
}
