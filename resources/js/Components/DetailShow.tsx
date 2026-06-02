import type { ReactNode } from 'react';

export function DetailItem({ label, value }: { label: string; value?: ReactNode | string | null }) {
    const display =
        value == null || (typeof value === 'string' && !value.trim()) ? '—' : value;

    return (
        <div className="min-w-0">
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</dt>
            <dd className="mt-1 break-words text-sm text-gray-900">{display}</dd>
        </div>
    );
}

export function DetailGrid({
    children,
    cols = 2,
    className = '',
}: {
    children: ReactNode;
    cols?: 2 | 3;
    className?: string;
}) {
    const colsClass =
        cols === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2';

    return <dl className={`grid grid-cols-1 gap-4 ${colsClass} ${className}`}>{children}</dl>;
}

export function PageToolbar({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
        >
            {children}
        </div>
    );
}

export function PageToolbarActions({ children }: { children: ReactNode }) {
    return (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center [&_a]:w-full sm:[&_a]:w-auto [&_button]:w-full sm:[&_button]:w-auto">
            {children}
        </div>
    );
}
