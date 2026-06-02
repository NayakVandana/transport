import FormDatePicker, { type DatePickerRangeValue } from '@/Components/FormDatePicker';
import SecondaryButton from '@/Components/SecondaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { buildListFilterParams, dateFiltersFromPicker } from '@/lib/listFilters';
import { formatMoney } from '@/lib/freightCalculator';
import { useCallback, useEffect, useState } from 'react';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type ChartPoint = {
    key: string;
    label: string;
    balance_due: number;
    received: number;
    invoice_count: number;
};

type DashboardChartData = {
    summary: {
        balance_due: number;
        received: number;
        outstanding: number;
        invoice_count: number;
        payment_count: number;
    };
    series: ChartPoint[];
    granularity: 'day' | 'month';
    filterSummary: string;
};

type ChartTooltipProps = {
    active?: boolean;
    label?: string;
    payload?: Array<{
        dataKey?: string;
        name?: string;
        value?: number;
        color?: string;
    }>;
};

function ChartIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
        </svg>
    );
}

function formatAxisAmount(value: number): string {
    const amount = Number(value);

    if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1)}L`;
    }

    if (amount >= 1000) {
        return `₹${Math.round(amount / 1000)}K`;
    }

    return `₹${amount}`;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-lg">
            <p className="mb-2 font-semibold text-gray-900">{label}</p>
            <div className="space-y-1">
                {payload.map((entry) => (
                    <p key={String(entry.dataKey)} className="flex items-center gap-2 text-gray-700">
                        <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span>{entry.name}:</span>
                        <span className="font-medium">₹ {formatMoney(Number(entry.value ?? 0))}</span>
                    </p>
                ))}
            </div>
        </div>
    );
}

export default function DashboardChartSection() {
    const [dateValue, setDateValue] = useState<DatePickerRangeValue>({
        startDate: null,
        endDate: null,
    });
    const [data, setData] = useState<DashboardChartData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const hasDateFilter = Boolean(dateValue.startDate);

    const loadChart = useCallback(async (dates: DatePickerRangeValue) => {
        setLoading(true);
        setError(null);

        try {
            const res = await appApiPost<ApiEnvelope<DashboardChartData>>(
                '/dashboard/dashboard-chart',
                buildListFilterParams(dateFiltersFromPicker(dates)),
            );

            if (!res.success || !res.data) {
                setError(res.message || 'Could not load chart data.');
                return;
            }

            setData(res.data);
        } catch {
            setError('Could not load chart data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadChart(dateValue);
    }, [dateValue, loadChart]);

    const clearDates = () => {
        setDateValue({ startDate: null, endDate: null });
    };

    return (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                            <ChartIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Financial Overview</h3>
                            <p className="text-xs text-gray-500">
                                Balance due vs received by{' '}
                                {data?.granularity === 'day' ? 'day' : 'month'}
                            </p>
                        </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
                        <div className="w-full min-w-0 sm:max-w-xs">
                            <FormDatePicker
                                value={dateValue}
                                onChange={setDateValue}
                                isRange
                                useRange
                                placeholder="All dates"
                            />
                        </div>
                        {hasDateFilter && (
                            <SecondaryButton type="button" onClick={clearDates}>
                                Clear dates
                            </SecondaryButton>
                        )}
                    </div>
                </div>

                <p className="mt-3 text-xs text-gray-500">
                    {data?.filterSummary ?? 'All records'}
                </p>
            </div>

            <div className="space-y-6 p-4 sm:p-6">
                {error && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {error}
                    </p>
                )}

                {loading && !data ? (
                    <p className="py-10 text-center text-sm text-gray-500">Loading chart…</p>
                ) : data ? (
                    <>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <SummaryPill
                                label="Balance Due"
                                value={`₹ ${formatMoney(data.summary.balance_due)}`}
                                sub={`${data.summary.invoice_count} invoice${data.summary.invoice_count === 1 ? '' : 's'}`}
                                tone="amber"
                            />
                            <SummaryPill
                                label="Received"
                                value={`₹ ${formatMoney(data.summary.received)}`}
                                sub={`${data.summary.payment_count} payment${data.summary.payment_count === 1 ? '' : 's'}`}
                                tone="green"
                            />
                            <SummaryPill
                                label="Outstanding"
                                value={`₹ ${formatMoney(data.summary.outstanding)}`}
                                sub="In selected period"
                                tone="indigo"
                            />
                        </div>

                        {data.series.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-500">
                                <ChartIcon className="h-10 w-10 text-gray-300" />
                                <p className="text-sm">No invoice or payment data for this period.</p>
                            </div>
                        ) : (
                            <div className="h-72 w-full min-w-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={data.series}
                                        margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fill: '#6b7280', fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={{ stroke: '#e5e7eb' }}
                                        />
                                        <YAxis
                                            tickFormatter={formatAxisAmount}
                                            tick={{ fill: '#6b7280', fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={{ stroke: '#e5e7eb' }}
                                            width={56}
                                        />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Legend
                                            verticalAlign="top"
                                            height={36}
                                            formatter={(value) => (
                                                <span className="text-sm text-gray-700">{value}</span>
                                            )}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="balance_due"
                                            name="Balance Due"
                                            stroke="#f59e0b"
                                            strokeWidth={2.5}
                                            dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
                                            activeDot={{ r: 6 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="received"
                                            name="Received"
                                            stroke="#22c55e"
                                            strokeWidth={2.5}
                                            dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </>
                ) : null}
            </div>
        </div>
    );
}

function SummaryPill({
    label,
    value,
    sub,
    tone,
}: {
    label: string;
    value: string;
    sub: string;
    tone: 'amber' | 'green' | 'indigo';
}) {
    const toneClass =
        tone === 'green'
            ? 'border-green-100 bg-green-50 text-green-800'
            : tone === 'indigo'
              ? 'border-violet-100 bg-violet-50 text-indigo-800'
              : 'border-amber-100 bg-amber-50 text-amber-800';

    return (
        <div className={`rounded-xl border px-4 py-3 ${toneClass}`}>
            <p className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</p>
            <p className="mt-1 text-lg font-semibold">{value}</p>
            <p className="mt-0.5 text-xs opacity-70">{sub}</p>
        </div>
    );
}
