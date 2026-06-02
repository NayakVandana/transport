import type { ReactNode } from 'react';

export type ListingMobileField = {
    label: string;
    value: ReactNode;
    emphasis?: boolean;
    /** Span both columns in the mobile field grid. */
    fullWidth?: boolean;
};

type Props = {
    title: ReactNode;
    subtitle?: ReactNode;
    /** Badge or status shown top-right (e.g. payment status). */
    headerRight?: ReactNode;
    /** Highlighted amount/value row with a clear label. */
    metric?: { label: string; value: ReactNode };
    /** @deprecated Prefer `metric`. Shown using `metricLabel`. */
    trailing?: ReactNode;
    metricLabel?: string;
    fields?: ListingMobileField[];
    actions?: ReactNode;
    index?: number;
    /** Flat rows for embedded lists (e.g. party tabs). */
    variant?: 'card' | 'flat';
};

export default function ListingMobileCard({
    title,
    subtitle,
    headerRight,
    metric,
    trailing,
    metricLabel = 'Amount',
    fields = [],
    actions,
    index,
    variant = 'card',
}: Props) {
    const primaryMetric = metric ?? (trailing ? { label: metricLabel, value: trailing } : null);

    if (variant === 'flat') {
        return (
            <li className="border-b border-gray-100 px-3 py-3 last:border-0 sm:px-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                            {index != null && (
                                <span className="shrink-0 tabular-nums text-xs font-medium text-gray-400">
                                    #{index}
                                </span>
                            )}
                            <div className="min-w-0 text-sm font-semibold leading-snug text-gray-900">
                                {title}
                            </div>
                        </div>
                        {subtitle ? (
                            <div className="mt-0.5 text-xs text-gray-500">{subtitle}</div>
                        ) : null}
                        {fields.length > 0 ? (
                            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                                {fields.map((field) => (
                                    <div
                                        key={field.label}
                                        className={field.fullWidth ? 'col-span-2' : 'min-w-0'}
                                    >
                                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                            {field.label}
                                        </dt>
                                        <dd className="mt-0.5 text-xs text-gray-700">{field.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        ) : null}
                    </div>
                    {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
                    {primaryMetric && !headerRight ? (
                        <div className="shrink-0 text-right">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                {primaryMetric.label}
                            </div>
                            <div className="mt-0.5 text-sm font-bold tabular-nums text-indigo-700">
                                {primaryMetric.value}
                            </div>
                        </div>
                    ) : null}
                </div>
                {primaryMetric && headerRight ? (
                    <div className="mt-2 flex items-center justify-between rounded-md bg-indigo-50 px-2.5 py-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-700/80">
                            {primaryMetric.label}
                        </span>
                        <span className="text-sm font-bold tabular-nums text-indigo-800">
                            {primaryMetric.value}
                        </span>
                    </div>
                ) : null}
                {actions ? (
                    <div className="mt-2 flex flex-wrap gap-2">{actions}</div>
                ) : null}
            </li>
        );
    }

    return (
        <li className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
                <div className="flex items-start gap-3">
                    {index != null && (
                        <span className="mt-0.5 shrink-0 tabular-nums text-xs font-medium text-gray-400">
                            #{index}
                        </span>
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="text-base font-semibold leading-snug text-gray-900">
                            {title}
                        </div>
                        {subtitle ? (
                            <div className="mt-1 text-sm leading-snug text-gray-500">{subtitle}</div>
                        ) : null}
                    </div>
                    {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
                </div>
            </div>

            {(primaryMetric || fields.length > 0) && (
                <div className="space-y-3 px-4 py-3">
                    {primaryMetric ? (
                        <div className="flex items-center justify-between gap-3 rounded-lg bg-indigo-50 px-3 py-2.5">
                            <span className="text-xs font-semibold uppercase tracking-wide text-indigo-700/80">
                                {primaryMetric.label}
                            </span>
                            <span className="text-base font-bold tabular-nums text-indigo-800">
                                {primaryMetric.value}
                            </span>
                        </div>
                    ) : null}

                    {fields.length > 0 ? (
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                            {fields.map((field) => (
                                <div
                                    key={field.label}
                                    className={field.fullWidth ? 'col-span-2' : 'min-w-0'}
                                >
                                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                        {field.label}
                                    </dt>
                                    <dd
                                        className={`mt-0.5 text-sm leading-snug ${
                                            field.emphasis
                                                ? 'font-semibold text-indigo-700'
                                                : 'text-gray-900'
                                        }`}
                                    >
                                        {field.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    ) : null}
                </div>
            )}

            {actions ? (
                <div className="mobile-list-actions grid grid-cols-2 gap-2 border-t border-gray-100 bg-gray-50 px-3 py-2.5 [&>*:last-child:nth-child(odd)]:col-span-2 [&_a]:flex [&_a]:w-full [&_button]:flex [&_button]:w-full">
                    {actions}
                </div>
            ) : null}
        </li>
    );
}
