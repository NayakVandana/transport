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

export function formatDisplayDate(value: string): string {
    const date = parseDateString(value);
    if (!date) {
        return value;
    }

    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function formatPickerDate(date: Date): string {
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function formatCompactDate(value: string): string {
    const date = parseDateString(value);
    if (!date) {
        return value;
    }

    const day = date.getDate();
    const month = date.toLocaleDateString('en-GB', { month: 'short' });
    const year = String(date.getFullYear()).slice(-2);

    return `${day} ${month} ${year}`;
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
