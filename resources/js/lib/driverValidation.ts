import type { Driver } from '@/types/transport';
import {
    addressFromEntity,
    defaultAddressForm,
    normalizeAddressPayload,
    validateAddressForm,
    type AddressFormData,
} from '@/lib/addressValidation';

export type DriverFormData = {
    name: string;
    email: string;
    aadhaar_no: string;
    pan_no: string;
    mobiles: string[];
    license_number: string;
    license_expiry: string;
    joining_date: string;
    salary: string;
    status: 'active' | 'inactive';
} & AddressFormData;

export function emptyDriverForm(): DriverFormData {
    return {
        name: '',
        email: '',
        aadhaar_no: '',
        pan_no: '',
        mobiles: [''],
        license_number: '',
        license_expiry: '',
        joining_date: '',
        salary: '',
        status: 'active',
        ...defaultAddressForm(),
    };
}

export function driverToFormData(driver: Driver): DriverFormData {
    const mobiles =
        driver.mobiles && driver.mobiles.length > 0
            ? driver.mobiles
            : driver.mobile
              ? [driver.mobile]
              : [''];

    return {
        name: driver.name ?? '',
        email: driver.email ?? '',
        aadhaar_no: driver.aadhaar_no ?? '',
        pan_no: driver.pan_no ?? '',
        mobiles,
        license_number: driver.license_number ?? '',
        license_expiry: driver.license_expiry?.slice(0, 10) ?? '',
        joining_date: driver.joining_date?.slice(0, 10) ?? '',
        salary: driver.salary != null ? String(driver.salary) : '',
        status: driver.status ?? 'active',
        ...addressFromEntity(driver),
    };
}

export function formatDriverMobiles(driver: Pick<Driver, 'mobile' | 'mobiles'>): string {
    const values =
        driver.mobiles && driver.mobiles.length > 0
            ? driver.mobiles
            : driver.mobile
              ? [driver.mobile]
              : [];

    return values.filter(Boolean).join(', ');
}

export function validateDriverForm(
    data: DriverFormData,
): Partial<Record<keyof DriverFormData | `mobiles.${number}`, string>> {
    const errors: Partial<Record<keyof DriverFormData | `mobiles.${number}`, string>> = {
        ...validateAddressForm(data),
    };

    if (!data.name.trim()) {
        errors.name = 'Driver name is required.';
    }

    if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
        errors.email = 'Enter a valid email address.';
    }

    if (data.aadhaar_no.trim() && !/^\d{12}$/.test(data.aadhaar_no.trim())) {
        errors.aadhaar_no = 'Aadhaar number must be 12 digits.';
    }

    if (data.pan_no.trim() && data.pan_no.trim().length > 20) {
        errors.pan_no = 'PAN number cannot exceed 20 characters.';
    }

    data.mobiles.forEach((mobile, index) => {
        if (mobile.length > 15) {
            errors[`mobiles.${index}`] = 'Mobile number cannot exceed 15 characters.';
        }
    });

    if (!['active', 'inactive'].includes(data.status)) {
        errors.status = 'Status must be Active or Inactive.';
    }

    return errors;
}

export function driverFormPayload(data: DriverFormData) {
    const normalized = normalizeAddressPayload(data);

    return {
        ...normalized,
        email: data.email.trim() || null,
        aadhaar_no: data.aadhaar_no.trim() || null,
        pan_no: data.pan_no.trim() || null,
        mobiles: data.mobiles.map((mobile) => mobile.trim()).filter(Boolean),
        license_number: data.license_number.trim() || null,
        license_expiry: data.license_expiry.trim() || null,
        joining_date: data.joining_date.trim() || null,
    };
}
