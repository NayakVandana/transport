export type VehicleExpenseFormData = {
    expense_date: string;
    vehicle_id: string;
    freight: string;
    advance: string;
    empty_charge: string;
    toll: string;
    maintenance: string;
};

function isValidAmount(value: string): boolean {
    return value !== '' && !Number.isNaN(Number(value)) && Number(value) >= 0;
}

export function validateVehicleExpenseForm(
    data: VehicleExpenseFormData,
): Partial<Record<keyof VehicleExpenseFormData, string>> {
    const errors: Partial<Record<keyof VehicleExpenseFormData, string>> = {};

    if (!data.expense_date) {
        errors.expense_date = 'Please select the date.';
    }

    if (!data.vehicle_id) {
        errors.vehicle_id = 'Please select a vehicle.';
    }

    if (!data.freight.trim()) {
        errors.freight = 'Please enter the freight amount.';
    } else if (!isValidAmount(data.freight)) {
        errors.freight = 'Freight must be a valid amount.';
    }

    for (const field of ['advance', 'empty_charge', 'toll', 'maintenance'] as const) {
        if (data[field].trim() && !isValidAmount(data[field])) {
            const label =
                field === 'empty_charge'
                    ? 'Empty charge'
                    : field.charAt(0).toUpperCase() + field.slice(1);
            errors[field] = `${label} must be a valid amount.`;
        }
    }

    return errors;
}
