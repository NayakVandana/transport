import PageContainer from '@/Components/PageContainer';
import DashboardChartSection from '@/Components/DashboardChartSection';
import ListingMobileAction from '@/Components/ListingMobileAction';
import ListingMobileCard from '@/Components/ListingMobileCard';
import ListingTableShell from '@/Components/ListingTableShell';
import PrimaryButton from '@/Components/PrimaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import InvoicePaymentStatusBadge, {
    invoicePaymentStatusFromAmounts,
} from '@/Components/InvoicePaymentStatusBadge';
import PartyLink from '@/Components/PartyLink';
import { formatAppCreatedAt, formatAppDateTime } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/freightCalculator';
import { useAppQuery } from '@/hooks/useAppQuery';
import { DetailPageHeader } from '@/Components/ListPageHeader';
import { usePageHeader } from '@/hooks/usePageHeader';
import type { FreightInvoice } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

type DashboardData = {
    stats: {
        parties: number;
        invoices: number;
        balance_due: number;
        received: number;
        outstanding: number;
        has_company: boolean;
    };
    recentInvoices: (FreightInvoice & { party?: { name: string } })[];
};

type StatAccent = 'slate' | 'indigo' | 'amber' | 'green' | 'violet';

const accentStyles: Record<
    StatAccent,
    { icon: string; value: string; ring: string }
> = {
    slate: {
        icon: 'bg-slate-100 text-slate-600',
        value: 'text-gray-900',
        ring: 'ring-slate-100',
    },
    indigo: {
        icon: 'bg-indigo-100 text-indigo-600',
        value: 'text-gray-900',
        ring: 'ring-indigo-100',
    },
    amber: {
        icon: 'bg-amber-100 text-amber-600',
        value: 'text-gray-900',
        ring: 'ring-amber-100',
    },
    green: {
        icon: 'bg-green-100 text-green-600',
        value: 'text-green-700',
        ring: 'ring-green-100',
    },
    violet: {
        icon: 'bg-violet-100 text-violet-600',
        value: 'text-indigo-700',
        ring: 'ring-violet-100',
    },
};

export default function Dashboard() {
    usePageHeader(<DetailPageHeader title="Transport Dashboard" />);

    const { data, loading, error } = useAppQuery('dashboard-summary', async () => {
        const res = await appApiPost<ApiEnvelope<DashboardData>>(
            '/dashboard/dashboard-summary',
            {},
        );

        if (!res.success || !res.data) {
            throw new Error(res.message || 'Could not load dashboard.');
        }

        return res.data;
    });

    return (
        <>
            <Head title="Dashboard" />

            <PageContainer className="space-y-6">
                {loading && !data ? (
                    <p className="text-center text-sm text-gray-500">Loading dashboard…</p>
                ) : error ? (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {error}
                    </p>
                ) : data ? (
                    <>
                        {!data.stats.has_company && (
                            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                                    <BuildingIcon className="h-5 w-5" />
                                </div>
                                <p className="text-sm leading-relaxed">
                                    Set up your{' '}
                                    <Link
                                        href={route('company.edit')}
                                        className="font-semibold underline"
                                    >
                                        company profile
                                    </Link>{' '}
                                    before creating tax invoices.
                                </p>
                            </div>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                            <StatCard
                                label="Party"
                                value={String(data.stats.parties)}
                                accent="slate"
                                icon={<UsersIcon className="h-6 w-6" />}
                            />
                            <StatCard
                                label="Invoices"
                                value={String(data.stats.invoices)}
                                accent="indigo"
                                icon={<DocumentIcon className="h-6 w-6" />}
                            />
                            <StatCard
                                label="Balance Due"
                                value={`₹ ${formatMoney(data.stats.balance_due)}`}
                                accent="amber"
                                icon={<CurrencyIcon className="h-6 w-6" />}
                            />
                            <StatCard
                                label="Received"
                                value={`₹ ${formatMoney(data.stats.received)}`}
                                accent="green"
                                icon={<CheckCircleIcon className="h-6 w-6" />}
                            />
                            <StatCard
                                label="Outstanding"
                                value={`₹ ${formatMoney(data.stats.outstanding)}`}
                                accent="violet"
                                icon={<ClockIcon className="h-6 w-6" />}
                            />
                        </div>

                        <div className="flex justify-stretch sm:justify-end">
                            <Link href={route('invoices.create')} className="w-full sm:w-auto">
                                <PrimaryButton className="inline-flex w-full items-center justify-center gap-2 sm:w-auto">
                                    <PlusIcon className="h-5 w-5" />
                                    New Tax Invoice
                                </PrimaryButton>
                            </Link>
                        </div>

                        <DashboardChartSection />

                        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                                        <DocumentIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            Recent Tax Invoices
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            Latest 5 invoices by created date
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href={route('invoices.index')}
                                    className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                                >
                                    View all
                                    <ChevronRightIcon className="h-4 w-4" />
                                </Link>
                            </div>
                            <ListingTableShell
                                className="overflow-hidden"
                                isEmpty={data.recentInvoices.length === 0}
                                mobileCountLabel={`${data.recentInvoices.length} recent invoice${data.recentInvoices.length === 1 ? '' : 's'}`}
                                emptyMessage={
                                    <span className="mx-auto flex max-w-xs flex-col items-center gap-2">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                                            <DocumentIcon className="h-6 w-6" />
                                        </div>
                                        <span>No invoices yet.</span>
                                    </span>
                                }
                                mobile={data.recentInvoices.map((inv, index) => (
                                    <ListingMobileCard
                                        key={inv.id}
                                        index={index + 1}
                                        title={inv.bill_number}
                                        subtitle={
                                            <PartyLink
                                                partyId={inv.party_id}
                                                name={inv.party?.name}
                                            />
                                        }
                                        headerRight={
                                            <InvoicePaymentStatusBadge
                                                status={
                                                    inv.payment_status ??
                                                    invoicePaymentStatusFromAmounts(
                                                        inv.received ?? 0,
                                                        inv.outstanding ??
                                                            inv.balance_amount,
                                                    )
                                                }
                                            />
                                        }
                                        metric={{
                                            label: 'Outstanding',
                                            value: `₹ ${formatMoney(inv.outstanding ?? inv.balance_amount)}`,
                                        }}
                                        fields={[
                                            {
                                                label: 'Received',
                                                value: `₹ ${formatMoney(inv.received ?? 0)}`,
                                            },
                                        ]}
                                        actions={
                                            <ListingMobileAction
                                                href={route('invoices.show', inv.id)}
                                                variant="primary"
                                            >
                                                View
                                            </ListingMobileAction>
                                        }
                                    />
                                ))}
                                thead={
                                    <tr>
                                        <th className="px-3 py-3 text-left font-medium text-gray-500 sm:px-6">
                                            Bill No
                                        </th>
                                        <th className="px-3 py-3 text-left font-medium text-gray-500 sm:px-6">
                                            Party
                                        </th>
                                        <th className="px-3 py-3 text-left font-medium text-gray-500 sm:px-6">
                                            Date
                                        </th>
                                        <th className="px-3 py-3 text-left font-medium text-gray-500 sm:px-6">
                                            Payment
                                        </th>
                                        <th className="px-3 py-3 text-right font-medium text-gray-500 sm:px-6">
                                            Balance Due
                                        </th>
                                        <th className="px-3 py-3 text-right font-medium text-gray-500 sm:px-6">
                                            Received
                                        </th>
                                        <th className="px-3 py-3 text-right font-medium text-gray-500 sm:px-6">
                                            Outstanding
                                        </th>
                                        <th className="px-3 py-3 text-left font-medium text-gray-500 sm:px-6">
                                            Created
                                        </th>
                                    </tr>
                                }
                                tbody={data.recentInvoices.map((inv) => (
                                    <tr
                                        key={inv.id}
                                        className="transition-colors hover:bg-gray-50/80"
                                    >
                                        <td className="px-3 py-3 font-medium sm:px-6">
                                            <Link
                                                href={route('invoices.show', inv.id)}
                                                className="text-indigo-600 hover:underline"
                                            >
                                                {inv.bill_number}
                                            </Link>
                                        </td>
                                        <td className="px-3 py-3 sm:px-6">
                                            <PartyLink
                                                partyId={inv.party_id}
                                                name={inv.party?.name}
                                            />
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3 sm:px-6">
                                            {formatAppDateTime(inv.invoice_date)}
                                        </td>
                                        <td className="px-3 py-3 sm:px-6">
                                            <InvoicePaymentStatusBadge
                                                status={
                                                    inv.payment_status ??
                                                    invoicePaymentStatusFromAmounts(
                                                        inv.received ?? 0,
                                                        inv.outstanding ?? inv.balance_amount,
                                                    )
                                                }
                                            />
                                        </td>
                                        <td className="px-3 py-3 text-right sm:px-6">
                                            ₹ {formatMoney(inv.balance_amount)}
                                        </td>
                                        <td className="px-3 py-3 text-right text-green-700 sm:px-6">
                                            ₹ {formatMoney(inv.received ?? 0)}
                                        </td>
                                        <td className="px-3 py-3 text-right font-medium text-indigo-700 sm:px-6">
                                            ₹{' '}
                                            {formatMoney(
                                                inv.outstanding ?? inv.balance_amount,
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3 text-gray-600 sm:px-6">
                                            {formatAppCreatedAt(inv.created_at)}
                                        </td>
                                    </tr>
                                ))}
                            />
                        </div>
                    </>
                ) : null}
            </PageContainer>
        </>
    );
}

function StatCard({
    label,
    value,
    accent,
    icon,
}: {
    label: string;
    value: string;
    accent: StatAccent;
    icon: ReactNode;
}) {
    const styles = accentStyles[accent];

    return (
        <div
            className={`rounded-xl bg-white p-5 shadow-sm ring-1 ${styles.ring}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-500">{label}</p>
                    <p className={`mt-2 truncate text-xl font-semibold sm:text-2xl ${styles.value}`}>
                        {value}
                    </p>
                </div>
                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}

function IconBase({
    className,
    children,
}: {
    className?: string;
    children: ReactNode;
}) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden
        >
            {children}
        </svg>
    );
}

function UsersIcon({ className }: { className?: string }) {
    return (
        <IconBase className={className}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
        </IconBase>
    );
}

function DocumentIcon({ className }: { className?: string }) {
    return (
        <IconBase className={className}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
        </IconBase>
    );
}

function CurrencyIcon({ className }: { className?: string }) {
    return (
        <IconBase className={className}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </IconBase>
    );
}

function CheckCircleIcon({ className }: { className?: string }) {
    return (
        <IconBase className={className}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </IconBase>
    );
}

function ClockIcon({ className }: { className?: string }) {
    return (
        <IconBase className={className}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </IconBase>
    );
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <IconBase className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </IconBase>
    );
}

function BuildingIcon({ className }: { className?: string }) {
    return (
        <IconBase className={className}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
        </IconBase>
    );
}

function ChevronRightIcon({ className }: { className?: string }) {
    return (
        <IconBase className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </IconBase>
    );
}
