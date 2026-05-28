export function todayDate(): string {
    return new Date().toISOString().slice(0, 10);
}

export function formatEntryNumber(prefix: string, sequence: number): string {
    return `${prefix}-${sequence}`;
}
