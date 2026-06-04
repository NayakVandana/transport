export const DEFAULT_COUNTRY = 'India';

export type AddressFormData = {
    full_address: string;
    city: string;
    taluka: string;
    district: string;
    pincode: string;
    state_code: string;
    country: string;
};

export function normalizeCountry(country?: string | null): string {
    const trimmed = (country ?? '').trim();

    return trimmed !== '' ? trimmed : DEFAULT_COUNTRY;
}

export function defaultAddressForm(): AddressFormData {
    return {
        full_address: '',
        city: '',
        taluka: '',
        district: '',
        pincode: '',
        state_code: '',
        country: DEFAULT_COUNTRY,
    };
}

export function addressFromEntity(
    entity: Partial<{
        full_address?: string | null;
        city?: string | null;
        taluka?: string | null;
        district?: string | null;
        pincode?: string | null;
        state_code?: string | null;
        country?: string | null;
        address?: string | null;
    }>,
): AddressFormData {
    return {
        full_address: entity.full_address ?? entity.address ?? '',
        city: entity.city ?? '',
        taluka: entity.taluka ?? '',
        district: entity.district ?? '',
        pincode: entity.pincode ?? '',
        state_code: entity.state_code ?? '',
        country: normalizeCountry(entity.country),
    };
}

export function normalizeAddressPayload(data: AddressFormData): AddressFormData {
    return {
        ...data,
        country: normalizeCountry(data.country),
    };
}

export function validateAddressForm(
    data: AddressFormData,
): Partial<Record<keyof AddressFormData, string>> {
    const errors: Partial<Record<keyof AddressFormData, string>> = {};

    if (data.state_code.length > 5) {
        errors.state_code = 'State code cannot exceed 5 characters.';
    }

    if (data.pincode.length > 10) {
        errors.pincode = 'Pincode cannot exceed 10 characters.';
    }

    return errors;
}
