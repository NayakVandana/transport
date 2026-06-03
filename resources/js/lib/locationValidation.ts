export type LocationFormData = {
    name: string;
};

export function validateLocationForm(
    data: LocationFormData,
): Partial<Record<keyof LocationFormData, string>> {
    const errors: Partial<Record<keyof LocationFormData, string>> = {};

    if (!data.name.trim()) {
        errors.name = 'Location name is required.';
    } else if (data.name.length > 255) {
        errors.name = 'Location name cannot exceed 255 characters.';
    }

    return errors;
}
