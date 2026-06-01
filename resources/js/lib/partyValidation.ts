export type PartyFormData = {
    name: string;
    mobile: string;
    address: string;
    state_code: string;
};

export function validatePartyForm(
    data: PartyFormData,
): Partial<Record<keyof PartyFormData, string>> {
    const errors: Partial<Record<keyof PartyFormData, string>> = {};

    if (!data.name.trim()) {
        errors.name = 'Party name is required.';
    }

    if (data.mobile.length > 15) {
        errors.mobile = 'Mobile number cannot exceed 15 characters.';
    }

    if (data.state_code.length > 5) {
        errors.state_code = 'State code cannot exceed 5 characters.';
    }

    return errors;
}
