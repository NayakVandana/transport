export type EntrybookFormData = {
    entry_date: string;
    vehicle_id: string;
    party_id: string;
    route_from: string;
    freight: string;
    advance: string;
};

export type EntrybookFieldMessages = Partial<
    Record<'required' | 'numeric' | 'min' | 'date' | 'exists' | 'max' | 'unique', string>
>;

export type EntrybookValidationMessages = Partial<
    Record<keyof EntrybookFormData, EntrybookFieldMessages>
>;

const DEFAULT_MESSAGES: EntrybookValidationMessages = {
    entry_date: {
        required: 'Please select the date.',
    },
    vehicle_id: {
        required: 'Please select a vehicle.',
    },
    party_id: {
        required: 'Please select a party.',
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
};

function messageFor(
    messages: EntrybookValidationMessages,
    field: keyof EntrybookFormData,
    rule: keyof EntrybookFieldMessages,
    fallback: string,
): string {
    return messages[field]?.[rule] ?? DEFAULT_MESSAGES[field]?.[rule] ?? fallback;
}

function isValidAmount(value: string): boolean {
    return value !== '' && !Number.isNaN(Number(value)) && Number(value) >= 0;
}

export function validateEntrybookForm(
    data: EntrybookFormData,
    customMessages: EntrybookValidationMessages = DEFAULT_MESSAGES,
): Partial<Record<keyof EntrybookFormData, string>> {
    const errors: Partial<Record<keyof EntrybookFormData, string>> = {};

    if (!data.entry_date) {
        errors.entry_date = messageFor(
            customMessages,
            'entry_date',
            'required',
            'Please select the date.',
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

    if (!data.party_id) {
        errors.party_id = messageFor(
            customMessages,
            'party_id',
            'required',
            'Please select a party.',
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

    return errors;
}
