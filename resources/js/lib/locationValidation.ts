export type LocationFormData = {
    name: string;
};

export function normalizeLocationName(name: string): string {
    const trimmed = name.trim().replace(/\s+/g, ' ');

    if (trimmed === '') {
        return '';
    }

    return trimmed.toUpperCase();
}

export function validateLocationForm(
    data: LocationFormData,
): Partial<Record<keyof LocationFormData, string>> {
    const errors: Partial<Record<keyof LocationFormData, string>> = {};
    const normalized = normalizeLocationName(data.name);

    if (!normalized) {
        errors.name = 'Location name is required.';
    } else if (normalized.length > 255) {
        errors.name = 'Location name cannot exceed 255 characters.';
    }

    return errors;
}

export function locationFormPayload(data: LocationFormData): LocationFormData {
    return {
        name: normalizeLocationName(data.name),
    };
}
