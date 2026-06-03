export function formatDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function parseDateString(value: string): Date | null {
    if (!value) {
        return null;
    }

    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) {
        return null;
    }

    return new Date(year, month - 1, day);
}

export function parseAppDate(value: string | Date | null | undefined): Date | null {
    if (value == null || value === '') {
        return null;
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    const str = String(value).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const [year, month, day] = str.split('-').map(Number);

        return new Date(year, month - 1, day);
    }

    const parsed = new Date(str);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatTime12h(date: Date): string {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    hours %= 12;

    if (hours === 0) {
        hours = 12;
    }

    return `${hours}:${String(minutes).padStart(2, '0')} ${period}`;
}

function isDateOnlyValue(value: string | Date): boolean {
    if (value instanceof Date) {
        return false;
    }

    const str = String(value).trim();

    return (
        /^\d{4}-\d{2}-\d{2}$/.test(str) ||
        /^\d{4}-\d{2}-\d{2}T00:00:00(\.\d+)?Z?$/.test(str)
    );
}

function formatDatePart(date: Date): string {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-GB', { month: 'short' });
    const year = date.getFullYear();

    return `${day} ${month}, ${year}`;
}

/** Display format: `30 May, 2026` or `30 May, 2026 | 4:15 PM` when time is present. */
export function formatAppDateTime(
    value: string | Date | null | undefined,
    fallback = '—',
): string {
    if (value == null || value === '') {
        return fallback;
    }

    const date = parseAppDate(value);

    if (!date) {
        return String(value);
    }

    const datePart = formatDatePart(date);

    if (isDateOnlyValue(value)) {
        return datePart;
    }

    const hasTime =
        date.getHours() !== 0 ||
        date.getMinutes() !== 0 ||
        date.getSeconds() !== 0 ||
        date.getMilliseconds() !== 0;

    if (!hasTime) {
        return datePart;
    }

    return `${datePart} | ${formatTime12h(date)}`;
}

/** Always show date and time — for `created_at` / timestamps. */
export function formatAppCreatedAt(
    value: string | Date | null | undefined,
    fallback = '—',
): string {
    if (value == null || value === '') {
        return fallback;
    }

    const date = parseAppDate(value);

    if (!date) {
        return String(value);
    }

    return `${formatDatePart(date)} | ${formatTime12h(date)}`;
}

/** @deprecated Use formatAppDateTime */
export function formatDisplayDate(value: string): string {
    return formatAppDateTime(value, value);
}

export function formatPickerDate(date: Date): string {
    return formatDatePart(date);
}

export function formatCompactDate(value: string): string {
    return formatAppDateTime(value, value);
}

/** Day number if set, otherwise weekday abbreviation from the report date. */
export function formatReportDayLabel(
    reportDate: string | null | undefined,
    day?: number | null,
    fallback = '—',
): string {
    if (day != null && day > 0) {
        return String(day);
    }

    const date = parseAppDate(reportDate);

    if (!date) {
        return fallback;
    }

    return date.toLocaleDateString('en-GB', { weekday: 'short' });
}

export function addMonths(date: Date, amount: number): Date {
    return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

export function compareDates(a: Date, b: Date): number {
    const aTime = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
    const bTime = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();

    return aTime - bTime;
}

export function isDateInRange(date: Date, start: Date | null, end: Date | null): boolean {
    if (!start || !end) {
        return false;
    }

    const time = compareDates(date, start);
    const endTime = compareDates(date, end);

    return time >= 0 && endTime <= 0;
}

export function getCalendarDays(month: Date): Date[] {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const startOffset = firstDay.getDay();
    const gridStart = new Date(year, monthIndex, 1 - startOffset);
    const days: Date[] = [];

    for (let index = 0; index < 42; index += 1) {
        const day = new Date(gridStart);
        day.setDate(gridStart.getDate() + index);
        days.push(day);
    }

    return days;
}
