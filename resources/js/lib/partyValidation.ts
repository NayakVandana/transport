import type { Party } from '@/types/transport';

export type PartyFormData = {
    name: string;
    party_owner_name: string;
    email: string;
    pan_no: string;
    gst_no: string;
    international_tax_id: string;
    mobiles: string[];
    full_address: string;
    city: string;
    taluka: string;
    district: string;
    pincode: string;
    state_code: string;
    country: string;
};

export function emptyPartyForm(): PartyFormData {
    return {
        name: '',
        party_owner_name: '',
        email: '',
        pan_no: '',
        gst_no: '',
        international_tax_id: '',
        mobiles: [''],
        full_address: '',
        city: '',
        taluka: '',
        district: '',
        pincode: '',
        state_code: '',
        country: 'India',
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
        full_address: party.full_address ?? party.address ?? '',
        city: party.city ?? '',
        taluka: party.taluka ?? '',
        district: party.district ?? '',
        pincode: party.pincode ?? '',
        state_code: party.state_code ?? '',
        country: party.country ?? 'India',
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
    const errors: Partial<Record<keyof PartyFormData | `mobiles.${number}`, string>> = {};

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

    if (data.state_code.length > 5) {
        errors.state_code = 'State code cannot exceed 5 characters.';
    }

    if (data.pincode.length > 10) {
        errors.pincode = 'Pincode cannot exceed 10 characters.';
    }

    return errors;
}

export function partyFormPayload(data: PartyFormData) {
    return {
        ...data,
        mobiles: data.mobiles.map((mobile) => mobile.trim()).filter(Boolean),
    };
}
