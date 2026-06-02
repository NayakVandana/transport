import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

type Props = {
    title: ReactNode;
    subtitle?: ReactNode;
    actions?: ReactNode;
    className?: string;
    /** Single-row header: title + action side-by-side on mobile (listing pages). */
    layout?: 'default' | 'compact';
};

/** Text link for in-content placement (mobile). */
export function InlineBackLink({
    href,
    label = 'Back to Parties',
    className = '',
}: {
    href: string;
    label?: string;
    className?: string;
}) {
    return (
        <Link
            href={href}
            className={`inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 ${className}`}
        >
            ← {label}
        </Link>
    );
}

/** Button-style back control for the page header (desktop). */
export function HeaderBackLink({
    href,
    label = 'Back to Parties',
    className = '',
}: {
    href: string;
    label?: string;
    className?: string;
}) {
    return (
        <Link
            href={href}
            className={`header-link-compact inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm hover:bg-gray-50 ${className}`}
        >
            {label}
        </Link>
    );
}

/** @deprecated Use InlineBackLink + HeaderBackLink for split mobile/desktop placement. */
export function ResponsiveBackLink({
    href,
    label = 'Back to Parties',
}: {
    href: string;
    label?: string;
}) {
    return (
        <Link
            href={href}
            className="header-link-compact inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 sm:rounded-md sm:border sm:border-gray-300 sm:bg-white sm:px-4 sm:py-2 sm:text-xs sm:font-semibold sm:uppercase sm:tracking-widest sm:text-gray-700 sm:shadow-sm sm:hover:bg-gray-50"
        >
            <span className="sm:hidden">← {label}</span>
            <span className="hidden sm:inline">{label}</span>
        </Link>
    );
}

const actionShellClass =
    'flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end [&_.header-link-compact]:!w-auto [&_a]:w-full sm:[&_a]:w-auto [&_button]:w-full sm:[&_button]:w-auto';

const compactActionShellClass =
    'flex shrink-0 flex-row items-center gap-2 [&_.header-link-compact]:!w-auto [&_a]:!w-auto [&_button]:!w-auto';

export default function PageHeaderBar({
    title,
    subtitle,
    actions,
    className = '',
    layout = 'default',
}: Props) {
    const isCompact = layout === 'compact';

    return (
        <div
            className={`page-header-bar ${
                isCompact ? 'page-header-bar--compact' : ''
            } flex w-full ${
                isCompact
                    ? 'flex-row items-center gap-2'
                    : 'flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3'
            } ${className}`}
        >
            <div className="min-w-0 flex-1">
                {typeof title === 'string' ? (
                    <h2 className="truncate text-base font-semibold leading-tight text-gray-800 sm:text-xl">
                        {title}
                    </h2>
                ) : (
                    title
                )}
                {subtitle ? (
                    <div className="mt-0.5 truncate text-xs text-gray-500 sm:text-sm">{subtitle}</div>
                ) : null}
            </div>
            {actions ? (
                <div className={isCompact ? compactActionShellClass : actionShellClass}>
                    {actions}
                </div>
            ) : null}
        </div>
    );
}

export function PageHeaderActions({ children }: { children: ReactNode }) {
    return <div className={actionShellClass}>{children}</div>;
}
