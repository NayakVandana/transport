import type { AddressFormData } from '@/lib/addressValidation';
import { validateAddressForm } from '@/lib/addressValidation';

export type CompanyFormData = {
    name: string;
    pan: string;
    gst: string;
    udyam_reg_no: string;
    udyam_date: string;
    jurisdiction: string;
    sac_code: string;
    entry_number_prefix: string;
    entry_next_sequence: string;
    igst_rate: string;
    bank_account_name: string;
    bank_account_no: string;
    bank_ifsc: string;
    bank_name: string;
    bank_branch: string;
} & AddressFormData;

export function validateCompanyForm(
    data: CompanyFormData,
): Partial<Record<keyof CompanyFormData, string>> {
    const errors: Partial<Record<keyof CompanyFormData, string>> = {
        ...validateAddressForm(data),
    };

    if (!data.name.trim()) {
        errors.name = 'Company name is required.';
    }

    if (!data.sac_code.trim()) {
        errors.sac_code = 'SAC code is required.';
    }

    if (!data.entry_number_prefix.trim()) {
        errors.entry_number_prefix = 'Entry prefix is required.';
    }

    if (!data.entry_next_sequence.trim()) {
        errors.entry_next_sequence = 'Next sequence number is required.';
    } else if (!Number.isInteger(Number(data.entry_next_sequence)) || Number(data.entry_next_sequence) < 1) {
        errors.entry_next_sequence = 'Next sequence number must be at least 1.';
    }

    if (!data.igst_rate.trim()) {
        errors.igst_rate = 'IGST rate is required.';
    } else {
        const rate = Number(data.igst_rate);
        if (Number.isNaN(rate)) {
            errors.igst_rate = 'IGST rate must be a number.';
        } else if (rate < 0 || rate > 100) {
            errors.igst_rate = 'IGST rate must be between 0 and 100.';
        }
    }

    return errors;
}
