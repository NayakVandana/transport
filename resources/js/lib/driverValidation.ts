export type DriverFormData = {
    name: string;
    mobile: string;
    license_number: string;
    license_expiry: string;
    joining_date: string;
    salary: string;
    address: string;
    status: 'active' | 'inactive';
};

export function validateDriverForm(
    data: DriverFormData,
): Partial<Record<keyof DriverFormData, string>> {
    const errors: Partial<Record<keyof DriverFormData, string>> = {};

    if (!data.name.trim()) {
        errors.name = 'Driver name is required.';
    }

    if (data.mobile.length > 15) {
        errors.mobile = 'Mobile number cannot exceed 15 characters.';
    }

    if (!['active', 'inactive'].includes(data.status)) {
        errors.status = 'Status must be Active or Inactive.';
    }

    return errors;
}
