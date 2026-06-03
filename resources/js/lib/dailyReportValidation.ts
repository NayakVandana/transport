export type DailyReportFormData = {
    report_date: string;
    serial_number: string;
    vehicle_id: string;
    description: string;
    current_party_id: string;
    planning_party_id: string;
    location: string;
    detention: string;
    day: string;
};

export type DailyReportDraftRow = {
    report_date: string;
    serial_number: number;
    vehicle_id: number;
    description: string;
    current_party_id: string;
    planning_party_id: string;
    location: string;
    detention: string;
    day: string;
};

export function validateDailyReportForm(
    data: DailyReportFormData,
): Partial<Record<keyof DailyReportFormData, string>> {
    const errors: Partial<Record<keyof DailyReportFormData, string>> = {};

    if (!data.report_date) {
        errors.report_date = 'Date is required.';
    }

    if (!data.vehicle_id) {
        errors.vehicle_id = 'Select a vehicle.';
    }

    if (data.detention.trim() && (Number.isNaN(Number(data.detention)) || Number(data.detention) < 0)) {
        errors.detention = 'Detention must be a valid amount.';
    }

    if (data.day.trim()) {
        const dayValue = Number(data.day);
        if (!Number.isInteger(dayValue) || dayValue < 1) {
            errors.day = 'Day must be a whole number of 1 or more.';
        }
    }

    if (data.description.length > 500) {
        errors.description = 'Description cannot exceed 500 characters.';
    }

    if (data.location.length > 255) {
        errors.location = 'Location cannot exceed 255 characters.';
    }

    return errors;
}

export function validateDailyReportDraftRow(
    row: DailyReportDraftRow,
): Partial<Record<keyof DailyReportFormData, string>> {
    return validateDailyReportForm({
        report_date: row.report_date,
        serial_number: String(row.serial_number),
        vehicle_id: String(row.vehicle_id),
        description: row.description,
        current_party_id: row.current_party_id,
        planning_party_id: row.planning_party_id,
        location: row.location,
        detention: row.detention,
        day: row.day,
    });
}
