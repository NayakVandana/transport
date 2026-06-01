export type RouteFormData = {
    name: string;
};

export function validateRouteForm(
    data: RouteFormData,
): Partial<Record<keyof RouteFormData, string>> {
    const errors: Partial<Record<keyof RouteFormData, string>> = {};

    if (!data.name.trim()) {
        errors.name = 'Route name is required.';
    } else if (data.name.length > 255) {
        errors.name = 'Route name cannot exceed 255 characters.';
    }

    return errors;
}
