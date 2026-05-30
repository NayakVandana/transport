export type VehicleExpenseFormData = {
    expense_date: string;
    vehicle_id: string;
    freight: string;
    advance: string;
    empty_charge: string;
    toll: string;
    maintenance: string;
};

export type VehicleExpenseFieldMessages = Partial<
    Record<'required' | 'numeric' | 'min' | 'date' | 'exists', string>
>;

export type VehicleExpenseValidationMessages = Partial<
    Record<keyof VehicleExpenseFormData, VehicleExpenseFieldMessages>
>;

const DEFAULT_MESSAGES: VehicleExpenseValidationMessages = {
    expense_date: {
        required: 'Please select the date.',
    },
    vehicle_id: {
        required: 'Please select a vehicle.',
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
    toll: {
        numeric: 'Toll must be a valid amount.',
        min: 'Toll cannot be negative.',
    },
    maintenance: {
        numeric: 'Maintenance must be a valid amount.',
        min: 'Maintenance cannot be negative.',
    },
};

function messageFor(
    messages: VehicleExpenseValidationMessages,
    field: keyof VehicleExpenseFormData,
    rule: keyof VehicleExpenseFieldMessages,
    fallback: string,
): string {
    return messages[field]?.[rule] ?? DEFAULT_MESSAGES[field]?.[rule] ?? fallback;
}

function isValidAmount(value: string): boolean {
    return value !== '' && !Number.isNaN(Number(value)) && Number(value) >= 0;
}

export function validateVehicleExpenseForm(
    data: VehicleExpenseFormData,
    customMessages: VehicleExpenseValidationMessages = DEFAULT_MESSAGES,
): Partial<Record<keyof VehicleExpenseFormData, string>> {
    const errors: Partial<Record<keyof VehicleExpenseFormData, string>> = {};

    if (!data.expense_date) {
        errors.expense_date = messageFor(
            customMessages,
            'expense_date',
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

    for (const field of ['advance', 'empty_charge', 'toll', 'maintenance'] as const) {
        if (data[field].trim() && !isValidAmount(data[field])) {
            errors[field] = messageFor(
                customMessages,
                field,
                'numeric',
                `${field.replace('_', ' ')} must be a valid amount.`,
            );
        }
    }

    return errors;
}
