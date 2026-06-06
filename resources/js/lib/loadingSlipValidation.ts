import { validateRoutePair } from '@/lib/routeHelpers';

let loadingSlipLineKeyCounter = 0;

function locationsMatch(a: string, b: string): boolean {
    return (
        a.trim() !== ''
        && b.trim() !== ''
        && a.trim().localeCompare(b.trim(), undefined, { sensitivity: 'accent' }) === 0
    );
}

export function newLoadingSlipLineKey(): string {
    loadingSlipLineKeyCounter += 1;
    return `ls-line-${loadingSlipLineKeyCounter}-${Date.now()}`;
}

export type LoadingSlipLineDraft = {
    key: string;
    vehicle_id: string;
    vehicle_number: string;
    destination: string;
    freight_rate: string;
    advance: string;
};

export type LoadingSlipFormData = {
    slip_date: string;
    loading_date: string;
    party_id: string;
    route_from: string;
    route_to: string;
    authorized_signatory: string;
    lines: LoadingSlipLineDraft[];
};

export function emptyLoadingSlipLine(): LoadingSlipLineDraft {
    return {
        key: newLoadingSlipLineKey(),
        vehicle_id: '',
        vehicle_number: '',
        destination: '',
        freight_rate: '',
        advance: '0',
    };
}

export function normalizeLoadingSlipLine(line: Partial<LoadingSlipLineDraft>): LoadingSlipLineDraft {
    return {
        key: line.key?.trim() ? line.key : newLoadingSlipLineKey(),
        vehicle_id: line.vehicle_id ?? '',
        vehicle_number: line.vehicle_number ?? '',
        destination: line.destination ?? '',
        freight_rate: line.freight_rate ?? '',
        advance: line.advance ?? '0',
    };
}

export function normalizeLoadingSlipLines(lines: LoadingSlipLineDraft[]): LoadingSlipLineDraft[] {
    return lines.map((line) => normalizeLoadingSlipLine(line));
}

export function ensureLoadingSlipLine(line: Partial<LoadingSlipLineDraft>): LoadingSlipLineDraft {
    return normalizeLoadingSlipLine(line);
}

export function lineBalance(freight: string, advance: string): number {
    return Math.round(((Number(freight) || 0) - (Number(advance) || 0)) * 100) / 100;
}

export function slipTotals(lines: LoadingSlipLineDraft[]) {
    let totalFreight = 0;
    let totalAdvance = 0;
    for (const line of lines) {
        totalFreight += Number(line.freight_rate) || 0;
        totalAdvance += Number(line.advance) || 0;
    }
    return {
        total_freight: Math.round(totalFreight * 100) / 100,
        total_advance: Math.round(totalAdvance * 100) / 100,
        total_balance: Math.round((totalFreight - totalAdvance) * 100) / 100,
    };
}

export function validateLoadingSlipForm(data: LoadingSlipFormData): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!data.slip_date.trim()) errors.slip_date = 'Slip date is required.';
    if (!data.party_id) errors.party_id = 'Party is required.';

    const routeErrors = validateRoutePair(data.route_from, data.route_to);
    if (routeErrors.route_from) errors.route_from = routeErrors.route_from;
    if (routeErrors.route_to) errors.route_to = routeErrors.route_to;

    if (data.lines.length === 0) errors.lines = 'Add at least one vehicle line.';

    const fromRoute = data.route_from.trim();
    const toRoute = data.route_to.trim();
    const seenVehicleIds = new Map<string, number>();
    data.lines.forEach((line, index) => {
        if (!line.vehicle_id && !line.vehicle_number.trim()) {
            errors[`lines.${index}.vehicle_id`] = 'Vehicle is required.';
        }
        const vehicleId = line.vehicle_id.trim();
        if (vehicleId) {
            const firstIndex = seenVehicleIds.get(vehicleId);
            if (firstIndex !== undefined) {
                const message = 'This vehicle is already used on another line.';
                errors[`lines.${index}.vehicle_id`] = message;
                if (!errors[`lines.${firstIndex}.vehicle_id`]) {
                    errors[`lines.${firstIndex}.vehicle_id`] = message;
                }
            } else {
                seenVehicleIds.set(vehicleId, index);
            }
        }
        if (line.freight_rate.trim() === '' || Number(line.freight_rate) < 0) {
            errors[`lines.${index}.freight_rate`] = 'Freight rate is required.';
        }
        const destination = line.destination.trim();
        if (!destination) {
            errors[`lines.${index}.destination`] = 'Destination is required.';
        } else if (fromRoute && locationsMatch(destination, fromRoute)) {
            errors[`lines.${index}.destination`] = 'Destination must be different from the from route.';
        } else if (toRoute && locationsMatch(destination, toRoute)) {
            errors[`lines.${index}.destination`] = 'Destination must be different from the to route.';
        }
    });
    return errors;
}
