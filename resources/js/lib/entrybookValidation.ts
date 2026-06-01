export type EntrybookFormData = {
    entry_date: string;
    vehicle_id: string;
    party_id: string;
    route_from: string;
    freight: string;
    advance: string;
};

function isValidAmount(value: string): boolean {
    return value !== '' && !Number.isNaN(Number(value)) && Number(value) >= 0;
}

export function validateEntrybookForm(
    data: EntrybookFormData,
): Partial<Record<keyof EntrybookFormData, string>> {
    const errors: Partial<Record<keyof EntrybookFormData, string>> = {};

    if (!data.entry_date) {
        errors.entry_date = 'Please select the date.';
    }

    if (!data.vehicle_id) {
        errors.vehicle_id = 'Please select a vehicle.';
    }

    if (!data.party_id) {
        errors.party_id = 'Please select a party.';
    }

    if (!data.freight.trim()) {
        errors.freight = 'Please enter the freight amount.';
    } else if (!isValidAmount(data.freight)) {
        errors.freight = 'Freight must be a valid amount.';
    }

    if (data.advance.trim() && !isValidAmount(data.advance)) {
        errors.advance = 'Advance must be a valid amount.';
    }

    return errors;
}
