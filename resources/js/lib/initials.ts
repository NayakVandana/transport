export function initialsFromName(name: string | null | undefined, max = 2): string {
    const parts = (name ?? '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
        return '?';
    }

    if (parts.length === 1) {
        return parts[0].slice(0, max).toUpperCase();
    }

    return parts
        .slice(0, max)
        .map((part) => part[0] ?? '')
        .join('')
        .toUpperCase();
}
