import type { Party } from '@/types/transport';
import {
    addressFromEntity,
    defaultAddressForm,
    normalizeAddressPayload,
    validateAddressForm,
    type AddressFormData,
} from '@/lib/addressValidation';

export type PartyFormData = {
    name: string;
    party_owner_name: string;
    email: string;
    pan_no: string;
    gst_no: string;
    international_tax_id: string;
    mobiles: string[];
} & AddressFormData;

export function emptyPartyForm(): PartyFormData {
    return {
        name: '',
        party_owner_name: '',
        email: '',
        pan_no: '',
        gst_no: '',
        international_tax_id: '',
        mobiles: [''],
        ...defaultAddressForm(),
    };
}

export function partyToFormData(party: Party): PartyFormData {
    const mobiles =
        party.mobiles && party.mobiles.length > 0
            ? party.mobiles
            : party.mobile
              ? [party.mobile]
              : [''];

    return {
        name: party.name ?? '',
        party_owner_name: party.party_owner_name ?? '',
        email: party.email ?? '',
        pan_no: party.pan_no ?? '',
        gst_no: party.gst_no ?? '',
        international_tax_id: party.international_tax_id ?? '',
        mobiles,
        ...addressFromEntity(party),
    };
}

export function formatPartyMobiles(party: Pick<Party, 'mobile' | 'mobiles'>): string {
    const values =
        party.mobiles && party.mobiles.length > 0
            ? party.mobiles
            : party.mobile
              ? [party.mobile]
              : [];

    return values.filter(Boolean).join(', ');
}

export function validatePartyForm(
    data: PartyFormData,
): Partial<Record<keyof PartyFormData | `mobiles.${number}`, string>> {
    const errors: Partial<Record<keyof PartyFormData | `mobiles.${number}`, string>> = {
        ...validateAddressForm(data),
    };

    if (!data.name.trim()) {
        errors.name = 'Party name is required.';
    }

    if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
        errors.email = 'Enter a valid email address.';
    }

    data.mobiles.forEach((mobile, index) => {
        if (mobile.length > 15) {
            errors[`mobiles.${index}`] = 'Mobile number cannot exceed 15 characters.';
        }
    });

    return errors;
}

export function partyFormPayload(data: PartyFormData) {
    const normalized = normalizeAddressPayload(data);

    return {
        ...normalized,
        mobiles: data.mobiles.map((mobile) => mobile.trim()).filter(Boolean),
    };
}
