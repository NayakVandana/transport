export type VehicleFormData = {
    vehicle_number: string;
    vehicle_type: string;
    brand: string;
    model: string;
    capacity: string;
    fuel_type: string;
    insurance_number: string;
    insurance_expiry: string;
    permit_number: string;
    permit_expiry: string;
    pollution_expiry: string;
    fitness_expiry: string;
    tax_name: string;
    tax_expiry: string;
    status: 'active' | 'inactive';
};

export type VehicleFieldMessages = Partial<
    Record<'required' | 'max' | 'date' | 'unique' | 'in' | 'required_with', string>
>;

export type VehicleValidationMessages = Partial<
    Record<keyof VehicleFormData, VehicleFieldMessages>
>;

export const VEHICLE_FIELD_LABELS: Record<keyof VehicleFormData, string> = {
    vehicle_number: 'Vehicle Number',
    vehicle_type: 'Vehicle Type',
    brand: 'Brand',
    model: 'Model',
    capacity: 'Capacity',
    fuel_type: 'Fuel Type',
    insurance_number: 'Insurance Number',
    insurance_expiry: 'Insurance Expiry',
    permit_number: 'Permit Number',
    permit_expiry: 'Permit Expiry',
    pollution_expiry: 'PUC Expiry',
    fitness_expiry: 'Fitness Expiry',
    tax_name: 'Tax Name',
    tax_expiry: 'Tax Expiry',
    status: 'Status',
};

const MAX_LENGTH: Partial<Record<keyof VehicleFormData, number>> = {
    vehicle_number: 20,
    vehicle_type: 100,
    brand: 100,
    model: 100,
    capacity: 50,
    insurance_number: 50,
    permit_number: 50,
    tax_name: 100,
};

const DEFAULT_MESSAGES: VehicleValidationMessages = {
    vehicle_number: {
        required: 'Please enter the vehicle registration number (e.g. MH04JU9931).',
        max: 'Vehicle number cannot exceed 20 characters.',
        unique: 'This vehicle number is already registered in your fleet.',
    },
    vehicle_type: {
        required: 'Please enter the vehicle type (e.g. Truck, Container).',
        max: 'Vehicle type cannot exceed 100 characters.',
    },
    brand: {
        required: 'Please enter the vehicle brand (e.g. Tata, Ashok Leyland).',
        max: 'Brand cannot exceed 100 characters.',
    },
    model: {
        required: 'Please enter the vehicle model.',
        max: 'Model cannot exceed 100 characters.',
    },
    capacity: {
        max: 'Capacity cannot exceed 50 characters.',
    },
    fuel_type: {
        required: 'Please select the fuel type.',
        in: 'Please select a valid fuel type.',
    },
    insurance_number: {
        required: 'Please enter the insurance policy number.',
        max: 'Insurance number cannot exceed 50 characters.',
    },
    insurance_expiry: {
        required: 'Please select the insurance expiry date.',
        date: 'Insurance expiry must be a valid date.',
    },
    permit_number: {
        required: 'Please enter the permit number.',
        max: 'Permit number cannot exceed 50 characters.',
    },
    permit_expiry: {
        required: 'Please select the permit expiry date.',
        date: 'Permit expiry must be a valid date.',
    },
    pollution_expiry: {
        required: 'Please select the PUC expiry date.',
        date: 'PUC expiry must be a valid date.',
    },
    fitness_expiry: {
        required: 'Please select the fitness certificate expiry date.',
        date: 'Fitness expiry must be a valid date.',
    },
    tax_name: {
        required_with: 'Please enter the tax name (e.g. Gujarat Tax).',
        max: 'Tax name cannot exceed 100 characters.',
    },
    tax_expiry: {
        required_with: 'Please select the tax expiry date.',
        date: 'Tax expiry must be a valid date.',
    },
    status: {
        required: 'Please select whether the vehicle is active or inactive.',
        in: 'Status must be either Active or Inactive.',
    },
};

function messageFor(
    messages: VehicleValidationMessages,
    field: keyof VehicleFormData,
    rule: keyof VehicleFieldMessages,
    fallback: string,
): string {
    return messages[field]?.[rule] ?? DEFAULT_MESSAGES[field]?.[rule] ?? fallback;
}

export function validateVehicleForm(
    data: VehicleFormData,
    customMessages: VehicleValidationMessages = DEFAULT_MESSAGES,
    fuelTypes: string[] = [],
): Partial<Record<keyof VehicleFormData, string>> {
    const errors: Partial<Record<keyof VehicleFormData, string>> = {};

    const checkRequired = (field: keyof VehicleFormData, value: string) => {
        if (!value.trim()) {
            errors[field] = messageFor(
                customMessages,
                field,
                'required',
                `${VEHICLE_FIELD_LABELS[field]} is required.`,
            );
        }
    };

    const checkMax = (field: keyof VehicleFormData, value: string) => {
        const max = MAX_LENGTH[field];
        if (max && value.length > max) {
            errors[field] = messageFor(
                customMessages,
                field,
                'max',
                `${VEHICLE_FIELD_LABELS[field]} must not exceed ${max} characters.`,
            );
        }
    };

    checkRequired('vehicle_number', data.vehicle_number);
    checkMax('vehicle_number', data.vehicle_number);

    checkRequired('vehicle_type', data.vehicle_type);
    checkMax('vehicle_type', data.vehicle_type);

    checkRequired('brand', data.brand);
    checkMax('brand', data.brand);

    checkRequired('model', data.model);
    checkMax('model', data.model);

    checkMax('capacity', data.capacity);

    checkRequired('fuel_type', data.fuel_type);
    if (
        data.fuel_type &&
        fuelTypes.length > 0 &&
        !fuelTypes.includes(data.fuel_type)
    ) {
        errors.fuel_type = messageFor(
            customMessages,
            'fuel_type',
            'in',
            'Please select a valid fuel type.',
        );
    }

    checkRequired('insurance_number', data.insurance_number);
    checkMax('insurance_number', data.insurance_number);

    if (!data.insurance_expiry) {
        errors.insurance_expiry = messageFor(
            customMessages,
            'insurance_expiry',
            'required',
            'Insurance expiry is required.',
        );
    }

    checkRequired('permit_number', data.permit_number);
    checkMax('permit_number', data.permit_number);

    if (!data.permit_expiry) {
        errors.permit_expiry = messageFor(
            customMessages,
            'permit_expiry',
            'required',
            'Permit expiry is required.',
        );
    }

    if (!data.pollution_expiry) {
        errors.pollution_expiry = messageFor(
            customMessages,
            'pollution_expiry',
            'required',
            'PUC expiry is required.',
        );
    }

    if (!data.fitness_expiry) {
        errors.fitness_expiry = messageFor(
            customMessages,
            'fitness_expiry',
            'required',
            'Fitness expiry is required.',
        );
    }

    checkMax('tax_name', data.tax_name);

    if (data.tax_name.trim() && !data.tax_expiry) {
        errors.tax_expiry = messageFor(
            customMessages,
            'tax_expiry',
            'required_with',
            'Please select the tax expiry date.',
        );
    }

    if (data.tax_expiry && !data.tax_name.trim()) {
        errors.tax_name = messageFor(
            customMessages,
            'tax_name',
            'required_with',
            'Please enter the tax name (e.g. Gujarat Tax).',
        );
    }

    if (!data.status) {
        errors.status = messageFor(
            customMessages,
            'status',
            'required',
            'Status is required.',
        );
    }

    return errors;
}
