import { PageToolbar, PageToolbarActions } from '@/Components/DetailShow';
import { EntrybookBillCell, entrybookHasInvoice } from '@/Components/EntrybookBillCell';
import PageContainer from '@/Components/PageContainer';
import ListFilterBar from '@/Components/ListFilterBar';
import ListingMobileAction from '@/Components/ListingMobileAction';
import ListingMobileCard from '@/Components/ListingMobileCard';
import ListingTableShell from '@/Components/ListingTableShell';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import RecordPaymentForm, { type LockedPaymentParty } from '@/Components/RecordPaymentForm';
import PageHeaderBar, { HeaderBackLink, InlineBackLink } from '@/Components/PageHeaderBar';
import InvoicePaymentStatusBadge, {
    invoicePaymentStatusFromAmounts,
} from '@/Components/InvoicePaymentStatusBadge';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { usePageHeader } from '@/hooks/usePageHeader';
import { dateFiltersFromPicker } from '@/lib/listFilters';
import type { DatePickerRangeValue } from '@/Components/FormDatePicker';
import { formatAppDateTime } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/freightCalculator';
import { invoiceFromEntrybookHref } from '@/lib/invoiceReturn';
import type {
    PartyAccountData,
    PartyEntrybookRow,
    PartyInvoiceRow,
    PartyLedgerEntry,
} from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { PartyAccountTabId, PartyTabs, partyTabs } from './PartyTabs';

type TabId = PartyAccountTabId;

function StatCard({ label, value, tone }: { label: string; value: string; tone?: 'green' | 'indigo' }) {
    const toneClass =
        tone === 'green' ? 'text-green-700' : tone === 'indigo' ? 'text-indigo-700' : 'text-gray-900';

    return (
        <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`mt-1 text-lg font-semibold ${toneClass}`}>{value}</p>
        </div>
    );
}

export default function PartyShow({
    partyId,
    activeTab = 'overview',
}: {
    partyId: number;
    activeTab?: TabId;
}) {
    const tab = activeTab;
    const [account, setAccount] = useState<PartyAccountData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateValue, setDateValue] = useState<DatePickerRangeValue>({ startDate: null, endDate: null });
    const [paymentParty, setPaymentParty] = useState<LockedPaymentParty | null>(null);

    const loadAccount = useCallback(async () => {
        setLoading(true);
        setError(null);

        const dateFilters = dateFiltersFromPicker(dateValue);

        try {
            const res = await appApiPost<ApiEnvelope<PartyAccountData>>('/parties/party-account', {
                id: partyId,
                ...(dateFilters.date_from ? { date_from: dateFilters.date_from } : {}),
                ...(dateFilters.date_to ? { date_to: dateFilters.date_to } : {}),
            });

            if (!res.success || !res.data) {
                setError(res.message || 'Could not load party account.');
                return;
            }

            setAccount(res.data);
        } catch {
            setError('Could not load party account.');
        } finally {
            setLoading(false);
        }
    }, [partyId, dateValue]);

    useEffect(() => {
        void loadAccount();
    }, [loadAccount]);

    usePageHeader(
        <PageHeaderBar
            layout="compact"
            title={account?.party.name ?? 'Party'}
            subtitle={account?.party.mobile}
            actions={
                <div className="hidden shrink-0 sm:block">
                    <HeaderBackLink href={route('parties.index')} />
                </div>
            }
        />,
        [account?.party.name, account?.party.mobile],
    );

    const overview = account?.overview;

    const dateFilters = dateFiltersFromPicker(dateValue);
    const hasDateFilters = dateFilters.date_range !== 'all';

    const applyDateChange = (value: DatePickerRangeValue) => {
        setDateValue(value);
    };

    const clearDateFilters = () => {
        setDateValue({ startDate: null, endDate: null });
    };

    const openPartyPaymentModal = () => {
        if (!account || !overview) {
            return;
        }

        setPaymentParty({
            id: account.party.id,
            name: account.party.name,
            balance_due: overview.balance_due,
            received: overview.received,
            outstanding: overview.outstanding,
        });
    };

    return (
        <>
            <Head title={`${account?.party.name ?? 'Party'} — ${partyTabs.find((t) => t.id === tab)?.label ?? 'Overview'}`} />

            <PageContainer className="space-y-4">
                    {error && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {error}
                        </p>
                    )}

                    {loading && !account ? (
                        <p className="text-center text-sm text-gray-500">Loading party account…</p>
                    ) : account && overview ? (
                        <>
                            <div className="rounded-lg bg-white shadow">
                                <div className="px-3 pt-2 sm:hidden">
                                    <InlineBackLink href={route('parties.index')} />
                                </div>
                                <PartyTabs partyId={partyId} activeTab={tab} />

                                <div className={tab === 'overview' ? 'p-4 sm:p-6' : 'py-3 sm:p-6'}>
                                    {tab === 'overview' && (
                                        <div className="space-y-4">
                                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                                <StatCard
                                                    label="Invoices"
                                                    value={String(overview.invoice_count)}
                                                />
                                                <StatCard
                                                    label="Entries"
                                                    value={String(overview.entry_count ?? 0)}
                                                />
                                                <StatCard
                                                    label="Balance Due"
                                                    value={`₹ ${formatMoney(overview.balance_due)}`}
                                                />
                                                <StatCard
                                                    label="Received"
                                                    value={`₹ ${formatMoney(overview.received)}`}
                                                    tone="green"
                                                />
                                                <StatCard
                                                    label="Outstanding"
                                                    value={`₹ ${formatMoney(overview.outstanding)}`}
                                                    tone="indigo"
                                                />
                                            </div>

                                            {(overview.outstanding ?? 0) > 0 && (
                                                <div className="flex justify-stretch sm:justify-end">
                                                    <PrimaryButton
                                                        type="button"
                                                        className="w-full sm:w-auto"
                                                        onClick={openPartyPaymentModal}
                                                    >
                                                        Record Payment
                                                    </PrimaryButton>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-3">
                                                <Link
                                                    href={route('parties.edit', partyId)}
                                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                                >
                                                    Edit party
                                                </Link>
                                            </div>
                                        </div>
                                    )}

                                    {tab === 'ledger' && (
                                        <div className="space-y-3">
                                            <div className="px-3 sm:px-0">
                                                <ListFilterBar
                                                    embedded
                                                    dateValue={dateValue}
                                                    onDateChange={applyDateChange}
                                                    filterSummary={account.filterSummary}
                                                    hasActiveFilters={hasDateFilters}
                                                    onClear={clearDateFilters}
                                                />
                                            </div>
                                            <LedgerTable rows={account.ledger} />
                                        </div>
                                    )}

                                    {tab === 'invoices' && (
                                        <div>
                                            <PageToolbar className="border-b px-3 py-2 sm:px-4 sm:py-3">
                                                <h3 className="text-sm font-semibold text-gray-800 sm:text-base">
                                                    Tax Invoices
                                                </h3>
                                                <PageToolbarActions>
                                                    {(overview?.outstanding ?? 0) > 0 && (
                                                        <PrimaryButton
                                                            type="button"
                                                            onClick={openPartyPaymentModal}
                                                        >
                                                            Record Payment
                                                        </PrimaryButton>
                                                    )}
                                                    <Link href={route('invoices.create')}>
                                                        <PrimaryButton>New Invoice</PrimaryButton>
                                                    </Link>
                                                </PageToolbarActions>
                                            </PageToolbar>
                                            <InvoicesTable rows={account.invoices} />
                                        </div>
                                    )}

                                    {tab === 'entries' && (
                                        <div>
                                            <PageToolbar className="border-b px-3 py-2 sm:px-4 sm:py-3">
                                                <h3 className="text-sm font-semibold text-gray-800 sm:text-base">
                                                    Entrybook
                                                </h3>
                                                <PageToolbarActions>
                                                    <Link href={route('entrybooks.create')}>
                                                        <PrimaryButton>Add Entry</PrimaryButton>
                                                    </Link>
                                                </PageToolbarActions>
                                            </PageToolbar>
                                            <EntrybooksTable rows={account.entrybooks} partyId={partyId} />
                                        </div>
                                    )}

                                    {tab === 'payments' && (
                                        <div className="space-y-3">
                                            <div className="px-3 sm:px-0">
                                                <ListFilterBar
                                                    embedded
                                                    dateValue={dateValue}
                                                    onDateChange={applyDateChange}
                                                    filterSummary={account.filterSummary}
                                                    hasActiveFilters={hasDateFilters}
                                                    onClear={clearDateFilters}
                                                />
                                            </div>
                                            <div>
                                                <PageToolbar className="border-b px-3 py-2 sm:px-4 sm:py-3">
                                                    <h3 className="text-sm font-semibold text-gray-800 sm:text-base">
                                                        Received Payments
                                                    </h3>
                                                    {(overview?.outstanding ?? 0) > 0 && (
                                                        <PageToolbarActions>
                                                            <PrimaryButton
                                                                type="button"
                                                                onClick={openPartyPaymentModal}
                                                            >
                                                                Record Payment
                                                            </PrimaryButton>
                                                        </PageToolbarActions>
                                                    )}
                                                </PageToolbar>
                                                <PaymentsTable rows={account.payments} />
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </>
                    ) : null}
            </PageContainer>

            <Modal
                show={paymentParty !== null}
                onClose={() => setPaymentParty(null)}
                maxWidth="2xl"
            >
                <div className="p-4 sm:p-6">
                    <h3 className="text-lg font-semibold text-gray-900">Record Payment</h3>
                    {paymentParty && (
                        <div className="mt-4">
                            <RecordPaymentForm
                                key={`party-${paymentParty.id}`}
                                partyId={paymentParty.id}
                                lockedParty={paymentParty}
                                onSuccess={() => {
                                    setPaymentParty(null);
                                    void loadAccount();
                                }}
                                onCancel={() => setPaymentParty(null)}
                            />
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
}

function LedgerBillCell({ row }: { row: PartyLedgerEntry }) {
    const billNumber = row.bill_number ?? (row.type === 'invoice' ? row.reference : '');

    if (billNumber && row.invoice_id) {
        return (
            <Link
                href={route('invoices.show', row.invoice_id)}
                className="font-mono text-indigo-600 hover:underline"
            >
                {billNumber}
            </Link>
        );
    }

    return <span className="font-mono text-gray-700">{billNumber || '—'}</span>;
}

function LedgerTable({ rows }: { rows: PartyLedgerEntry[] }) {
    return (
        <ListingTableShell
            embedded
            className="overflow-hidden"
            isEmpty={rows.length === 0}
            mobileCountLabel={`${rows.length} ledger entr${rows.length === 1 ? 'y' : 'ies'}`}
            emptyMessage="No ledger entries yet."
            mobile={rows.map((row, index) => (
                <ListingMobileCard
                    key={
                        row.payment_id != null
                            ? `payment-${row.payment_id}`
                            : row.invoice_id != null
                              ? `invoice-${row.invoice_id}-${row.type}`
                              : `${row.type}-${row.date}-${index}`
                    }
                    variant="flat"
                    index={index + 1}
                    title={row.particulars}
                    subtitle={formatAppDateTime(row.date)}
                    metric={{
                        label: 'Balance',
                        value: `₹ ${formatMoney(row.balance)}`,
                    }}
                    fields={[
                        {
                            label: 'Bill No.',
                            value: <LedgerBillCell row={row} />,
                            fullWidth: true,
                        },
                        ...(row.debit > 0
                            ? [
                                  {
                                      label: 'Debit',
                                      value: `₹ ${formatMoney(row.debit)}`,
                                  },
                              ]
                            : row.credit > 0
                              ? [
                                    {
                                        label: 'Credit',
                                        value: `₹ ${formatMoney(row.credit)}`,
                                    },
                                ]
                              : []),
                    ]}
                />
            ))}
            thead={
                <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Particulars</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Bill No.</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Reference</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Debit</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Credit</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Balance</th>
                </tr>
            }
            tbody={rows.map((row, index) => (
                <tr
                    key={
                        row.payment_id != null
                            ? `payment-${row.payment_id}`
                            : row.invoice_id != null
                              ? `invoice-${row.invoice_id}-${row.type}`
                              : `${row.type}-${row.date}-${index}`
                    }
                >
                    <td className="px-4 py-3">{formatAppDateTime(row.date)}</td>
                    <td className="px-4 py-3">{row.particulars}</td>
                    <td className="px-4 py-3">
                        <LedgerBillCell row={row} />
                    </td>
                    <td className="px-4 py-3">{row.reference || '—'}</td>
                    <td className="px-4 py-3 text-right">
                        {row.debit > 0 ? `₹ ${formatMoney(row.debit)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-green-700">
                        {row.credit > 0 ? `₹ ${formatMoney(row.credit)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                        ₹ {formatMoney(row.balance)}
                    </td>
                </tr>
            ))}
        />
    );
}

function EntrybooksTable({ rows, partyId }: { rows: PartyEntrybookRow[]; partyId: number }) {
    return (
        <ListingTableShell
            embedded
            className="overflow-hidden"
            isEmpty={rows.length === 0}
            mobileCountLabel={`${rows.length} entr${rows.length === 1 ? 'y' : 'ies'}`}
            emptyMessage="No entrybook records for this party."
            mobile={rows.map((row, index) => (
                <ListingMobileCard
                    key={row.id}
                    variant="flat"
                    index={index + 1}
                    title={<span className="font-mono">{row.entry_number}</span>}
                    subtitle={formatAppDateTime(row.entry_date)}
                    metric={{
                        label: 'Balance',
                        value: `₹ ${formatMoney(row.balance)}`,
                    }}
                    fields={[
                        {
                            label: 'Vehicle',
                            value: row.vehicle_number || '—',
                        },
                        {
                            label: 'From',
                            value: row.route_from || '—',
                        },
                        {
                            label: 'Freight',
                            value: `₹ ${formatMoney(row.freight)}`,
                        },
                        {
                            label: 'Detention',
                            value: `₹ ${formatMoney(row.detention ?? 0)}`,
                        },
                        {
                            label: 'Bill',
                            value: row.bill_number ?? 'Pending',
                        },
                    ]}
                    actions={
                        <>
                            {!entrybookHasInvoice(row) && (
                                <ListingMobileAction
                                    href={invoiceFromEntrybookHref(
                                        { id: row.id, party_id: partyId },
                                        partyId,
                                    )}
                                    variant="success"
                                >
                                    Create Invoice
                                </ListingMobileAction>
                            )}
                            {entrybookHasInvoice(row) && row.invoice_id && (
                                <ListingMobileAction
                                    href={route('invoices.show', row.invoice_id)}
                                    variant="primary"
                                >
                                    View Bill
                                </ListingMobileAction>
                            )}
                            <ListingMobileAction
                                href={route('entrybooks.edit', row.id)}
                                variant={entrybookHasInvoice(row) ? 'secondary' : 'primary'}
                            >
                                Edit
                            </ListingMobileAction>
                        </>
                    }
                />
            ))}
            thead={
                <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Entry No.</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Vehicle</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">From</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Freight</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Advance</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Detention</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Balance</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Bill</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                </tr>
            }
            tbody={rows.map((row) => (
                <tr key={row.id}>
                    <td className="px-4 py-3 font-mono font-medium">{row.entry_number}</td>
                    <td className="px-4 py-3">{formatAppDateTime(row.entry_date)}</td>
                    <td className="px-4 py-3 font-mono">{row.vehicle_number || '—'}</td>
                    <td className="px-4 py-3">{row.route_from || '—'}</td>
                    <td className="px-4 py-3 text-right">₹ {formatMoney(row.freight)}</td>
                    <td className="px-4 py-3 text-right">₹ {formatMoney(row.advance)}</td>
                    <td className="px-4 py-3 text-right">₹ {formatMoney(row.detention ?? 0)}</td>
                    <td className="px-4 py-3 text-right font-medium">
                        ₹ {formatMoney(row.balance)}
                    </td>
                    <td className="px-4 py-3">
                        <EntrybookBillCell entry={{ ...row, party_id: partyId }} partyId={partyId} />
                    </td>
                    <td className="space-x-3 px-4 py-3 text-right">
                        <Link
                            href={route('entrybooks.edit', row.id)}
                            className="text-indigo-600 hover:underline"
                        >
                            Edit
                        </Link>
                    </td>
                </tr>
            ))}
        />
    );
}

function InvoicesTable({ rows }: { rows: PartyInvoiceRow[] }) {
    return (
        <ListingTableShell
            embedded
            className="overflow-hidden"
            isEmpty={rows.length === 0}
            mobileCountLabel={`${rows.length} invoice${rows.length === 1 ? '' : 's'}`}
            emptyMessage="No invoices for this party."
            mobile={rows.map((row, index) => (
                <ListingMobileCard
                    key={row.id}
                    variant="flat"
                    index={index + 1}
                    title={row.bill_number}
                    subtitle={formatAppDateTime(row.invoice_date)}
                    headerRight={
                        <InvoicePaymentStatusBadge
                            status={
                                row.payment_status ??
                                invoicePaymentStatusFromAmounts(
                                    row.received,
                                    row.outstanding,
                                )
                            }
                        />
                    }
                    metric={{
                        label: 'Outstanding',
                        value: `₹ ${formatMoney(row.outstanding)}`,
                    }}
                    fields={[
                        {
                            label: 'Received',
                            value: `₹ ${formatMoney(row.received)}`,
                        },
                        {
                            label: 'Due',
                            value: `₹ ${formatMoney(row.balance_amount)}`,
                        },
                    ]}
                    actions={
                        <ListingMobileAction
                            href={route('invoices.show', row.id)}
                            variant="primary"
                        >
                            View
                        </ListingMobileAction>
                    }
                />
            ))}
            thead={
                <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Bill No</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Payment</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Net Value</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Due</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Received</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Outstanding</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                </tr>
            }
            tbody={rows.map((row) => (
                <tr key={row.id}>
                    <td className="px-4 py-3 font-medium">
                        <Link
                            href={route('invoices.show', row.id)}
                            className="text-indigo-600 hover:underline"
                        >
                            {row.bill_number}
                        </Link>
                    </td>
                    <td className="px-4 py-3">{formatAppDateTime(row.invoice_date)}</td>
                    <td className="px-4 py-3">
                        <InvoicePaymentStatusBadge
                            status={
                                row.payment_status ??
                                invoicePaymentStatusFromAmounts(
                                    row.received,
                                    row.outstanding,
                                )
                            }
                        />
                    </td>
                    <td className="px-4 py-3 text-right">₹ {formatMoney(row.net_value)}</td>
                    <td className="px-4 py-3 text-right">
                        ₹ {formatMoney(row.balance_amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-green-700">
                        ₹ {formatMoney(row.received)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-indigo-700">
                        ₹ {formatMoney(row.outstanding)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Link
                            href={route('invoices.show', row.id)}
                            className="text-indigo-600 hover:underline"
                        >
                            View
                        </Link>
                    </td>
                </tr>
            ))}
        />
    );
}

function PaymentsTable({ rows }: { rows: PartyAccountData['payments'] }) {
    return (
        <ListingTableShell
            embedded
            className="overflow-hidden"
            isEmpty={rows.length === 0}
            mobileCountLabel={`${rows.length} payment${rows.length === 1 ? '' : 's'}`}
            emptyMessage="No payments recorded for this party."
            mobile={rows.map((row, index) => (
                <ListingMobileCard
                    key={row.id}
                    variant="flat"
                    index={index + 1}
                    title={formatAppDateTime(row.payment_date)}
                    subtitle={
                        row.freight_invoice_id ? (
                            <Link
                                href={route('invoices.show', row.freight_invoice_id)}
                                className="text-indigo-600 hover:underline"
                            >
                                Bill: {row.bill_number}
                            </Link>
                        ) : (
                            'Party account payment'
                        )
                    }
                    metric={{
                        label: 'Amount',
                        value: `₹ ${formatMoney(row.amount)}`,
                    }}
                    fields={[
                        {
                            label: 'Mode',
                            value: row.payment_mode ?? '—',
                        },
                        {
                            label: 'Reference',
                            value: row.reference_no ?? '—',
                        },
                    ]}
                />
            ))}
            thead={
                <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Bill No</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Mode</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Reference</th>
                </tr>
            }
            tbody={rows.map((row) => (
                <tr key={row.id}>
                    <td className="px-4 py-3">{formatAppDateTime(row.payment_date)}</td>
                    <td className="px-4 py-3">
                        {row.freight_invoice_id ? (
                            <Link
                                href={route('invoices.show', row.freight_invoice_id)}
                                className="text-indigo-600 hover:underline"
                            >
                                {row.bill_number}
                            </Link>
                        ) : (
                            <span className="text-gray-500">Party account</span>
                        )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                        ₹ {formatMoney(row.amount)}
                    </td>
                    <td className="px-4 py-3 capitalize">{row.payment_mode ?? '—'}</td>
                    <td className="px-4 py-3">{row.reference_no ?? '—'}</td>
                </tr>
            ))}
        />
    );
}
