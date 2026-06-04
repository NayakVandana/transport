export type LoadingSlipLineDraft = {
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
        vehicle_id: '',
        vehicle_number: '',
        destination: '',
        freight_rate: '',
        advance: '0',
    };
}

export function lineBalance(freight: string, advance: string): number {
    const freightValue = Number(freight) || 0;
    const advanceValue = Number(advance) || 0;

    return Math.round((freightValue - advanceValue) * 100) / 100;
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

export function validateLoadingSlipForm(
    data: LoadingSlipFormData,
): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!data.slip_date.trim()) {
        errors.slip_date = 'Slip date is required.';
    }

    if (!data.party_id) {
        errors.party_id = 'Party is required.';
    }

    if (data.lines.length === 0) {
        errors.lines = 'Add at least one vehicle line.';
    }

    data.lines.forEach((line, index) => {
        if (!line.vehicle_id && !line.vehicle_number.trim()) {
            errors[`lines.${index}.vehicle_id`] = 'Vehicle is required.';
        }

        if (line.freight_rate.trim() === '' || Number(line.freight_rate) < 0) {
            errors[`lines.${index}.freight_rate`] = 'Freight rate is required.';
        }
    });

    return errors;
}
