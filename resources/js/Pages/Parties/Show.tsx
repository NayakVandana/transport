import PageContainer from '@/Components/PageContainer';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import ListFilterBar from '@/Components/ListFilterBar';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import RecordPaymentForm, { type LockedPaymentParty } from '@/Components/RecordPaymentForm';
import SecondaryButton from '@/Components/SecondaryButton';
import InvoicePaymentStatusBadge, {
    invoicePaymentStatusFromAmounts,
} from '@/Components/InvoicePaymentStatusBadge';
import TextInput from '@/Components/TextInput';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { usePageHeader } from '@/hooks/usePageHeader';
import { dateFiltersFromPicker } from '@/lib/listFilters';
import type { DatePickerRangeValue } from '@/Components/FormDatePicker';
import { apiFieldErrors, hasApiFieldErrors } from '@/lib/apiFormErrors';
import { formatAppDateTime } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/freightCalculator';
import type {
    Party,
    PartyAccountData,
    PartyEntrybookRow,
    PartyInvoiceRow,
    PartyLedgerEntry,
} from '@/types/transport';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useCallback, useEffect, useMemo, useState } from 'react';

type TabId = 'overview' | 'ledger' | 'invoices' | 'entries' | 'payments' | 'profile';

const tabs: { id: TabId; label: string; route: string }[] = [
    { id: 'overview', label: 'Overview', route: 'parties.overview' },
    { id: 'ledger', label: 'Ledger', route: 'parties.ledger' },
    { id: 'invoices', label: 'Invoices', route: 'parties.invoices' },
    { id: 'entries', label: 'Entries', route: 'parties.entries' },
    { id: 'payments', label: 'Payments', route: 'parties.payments' },
    { id: 'profile', label: 'Profile', route: 'parties.profile' },
];

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

    const [profileData, setProfileData] = useState({
        name: '',
        mobile: '',
        address: '',
        state_code: '',
    });
    const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
    const [profileProcessing, setProfileProcessing] = useState(false);
    const [profileMessage, setProfileMessage] = useState<string | null>(null);

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
            setProfileData({
                name: res.data.party.name ?? '',
                mobile: res.data.party.mobile ?? '',
                address: res.data.party.address ?? '',
                state_code: res.data.party.state_code ?? '',
            });
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
        <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
                <h2 className="text-xl font-semibold text-gray-800">
                    {account?.party.name ?? 'Party'}
                </h2>
                {account?.party.mobile && (
                    <p className="text-sm text-gray-500">{account.party.mobile}</p>
                )}
            </div>
            <Link href={route('parties.index')}>
                <SecondaryButton>Back to Party</SecondaryButton>
            </Link>
        </div>,
        [account?.party.name, account?.party.mobile],
    );

    const overview = account?.overview;
    const recentLedger = useMemo(() => account?.ledger.slice(0, 8) ?? [], [account?.ledger]);
    const recentInvoices = useMemo(() => account?.invoices.slice(0, 5) ?? [], [account?.invoices]);
    const recentEntries = useMemo(() => account?.entrybooks.slice(0, 5) ?? [], [account?.entrybooks]);

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

    const submitProfile: FormEventHandler = async (e) => {
        e.preventDefault();
        setProfileErrors({});
        setProfileMessage(null);
        setProfileProcessing(true);

        try {
            const res = await appApiPost<ApiEnvelope<{ party: Party }>>('/parties/party-update', {
                id: partyId,
                ...profileData,
            });

            if (!res.success) {
                setProfileErrors(apiFieldErrors(res.data));
                if (!hasApiFieldErrors(res.data)) {
                    setProfileMessage(res.message || 'Could not update party.');
                }
                return;
            }

            setProfileMessage('Profile updated.');
            await loadAccount();
        } catch {
            setProfileMessage('Could not update party.');
        } finally {
            setProfileProcessing(false);
        }
    };

    const destroyParty = async () => {
        if (!confirm('Delete this party?')) {
            return;
        }

        const res = await appApiPost<ApiEnvelope<null>>('/parties/party-destroy', { id: partyId });

        if (!res.success) {
            setError(res.message || 'Could not delete party.');
            return;
        }

        router.visit(route('parties.index'));
    };

    return (
        <>
            <Head title={`${account?.party.name ?? 'Party'} — ${tabs.find((t) => t.id === tab)?.label ?? 'Overview'}`} />

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
                                <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 px-2">
                                    {tabs.map((item) => (
                                        <Link
                                            key={item.id}
                                            href={route(item.route, partyId)}
                                            preserveScroll
                                            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${
                                                tab === item.id
                                                    ? 'border-indigo-600 text-indigo-600'
                                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                            }`}
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </nav>

                                <div className="p-4 sm:p-6">
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
                                                <div className="flex justify-end">
                                                    <PrimaryButton
                                                        type="button"
                                                        onClick={openPartyPaymentModal}
                                                    >
                                                        Record Payment
                                                    </PrimaryButton>
                                                </div>
                                            )}

                                            <div className="grid gap-4 lg:grid-cols-3">
                                                <section className="rounded-lg border border-gray-200">
                                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                                                        <h3 className="font-semibold text-gray-800">
                                                            Recent Ledger
                                                        </h3>
                                                        <Link
                                                            href={route('parties.ledger', partyId)}
                                                            className="text-sm text-indigo-600 hover:underline"
                                                        >
                                                            View all
                                                        </Link>
                                                    </div>
                                                    <LedgerTable rows={recentLedger} compact />
                                                </section>

                                                <section className="rounded-lg border border-gray-200">
                                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                                                        <h3 className="font-semibold text-gray-800">
                                                            Recent Invoices
                                                        </h3>
                                                        <Link
                                                            href={route('parties.invoices', partyId)}
                                                            className="text-sm text-indigo-600 hover:underline"
                                                        >
                                                            View all
                                                        </Link>
                                                    </div>
                                                    <InvoicesTable rows={recentInvoices} compact />
                                                </section>

                                                <section className="rounded-lg border border-gray-200">
                                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                                                        <h3 className="font-semibold text-gray-800">
                                                            Recent Entries
                                                        </h3>
                                                        <Link
                                                            href={route('parties.entries', partyId)}
                                                            className="text-sm text-indigo-600 hover:underline"
                                                        >
                                                            View all
                                                        </Link>
                                                    </div>
                                                    <EntrybooksTable rows={recentEntries} compact />
                                                </section>

                                                <section className="rounded-lg border border-gray-200 p-4 lg:col-span-3">
                                                    <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                                                        <div>
                                                            <dt className="text-gray-500">Last invoice</dt>
                                                            <dd>{formatAppDateTime(overview.last_invoice_date)}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="text-gray-500">Last payment</dt>
                                                            <dd>{formatAppDateTime(overview.last_payment_date)}</dd>
                                                        </div>
                                                        <div className="sm:col-span-2">
                                                            <dt className="text-gray-500">Address</dt>
                                                            <dd>{account.party.address ?? '—'}</dd>
                                                        </div>
                                                    </dl>
                                                </section>
                                            </div>
                                        </div>
                                    )}

                                    {tab === 'ledger' && (
                                        <div className="space-y-4">
                                            <ListFilterBar
                                                dateValue={dateValue}
                                                onDateChange={applyDateChange}
                                                filterSummary={account.filterSummary}
                                                hasActiveFilters={hasDateFilters}
                                                onClear={clearDateFilters}
                                            />
                                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                                <LedgerTable rows={account.ledger} />
                                            </div>
                                        </div>
                                    )}

                                    {tab === 'invoices' && (
                                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                                            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                                                <h3 className="font-semibold text-gray-800">Tax Invoices</h3>
                                                <div className="flex flex-wrap gap-2">
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
                                                </div>
                                            </div>
                                            <InvoicesTable rows={account.invoices} />
                                        </div>
                                    )}

                                    {tab === 'entries' && (
                                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                                            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                                                <h3 className="font-semibold text-gray-800">Entrybook</h3>
                                                <Link href={route('entrybooks.create')}>
                                                    <PrimaryButton>Add Entry</PrimaryButton>
                                                </Link>
                                            </div>
                                            <EntrybooksTable rows={account.entrybooks} />
                                        </div>
                                    )}

                                    {tab === 'payments' && (
                                        <div className="space-y-4">
                                            <ListFilterBar
                                                dateValue={dateValue}
                                                onDateChange={applyDateChange}
                                                filterSummary={account.filterSummary}
                                                hasActiveFilters={hasDateFilters}
                                                onClear={clearDateFilters}
                                            />
                                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                                                    <h3 className="font-semibold text-gray-800">
                                                        Received Payments
                                                    </h3>
                                                    {(overview?.outstanding ?? 0) > 0 && (
                                                        <PrimaryButton
                                                            type="button"
                                                            onClick={openPartyPaymentModal}
                                                        >
                                                            Record Payment
                                                        </PrimaryButton>
                                                    )}
                                                </div>
                                                <PaymentsTable rows={account.payments} />
                                            </div>
                                        </div>
                                    )}

                                    {tab === 'profile' && (
                                        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
                                            {profileMessage && (
                                                <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                                                    {profileMessage}
                                                </p>
                                            )}

                                            <form onSubmit={submitProfile} className="space-y-5">
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                <div>
                                                    <InputLabel value="Name" />
                                                    <TextInput
                                                        className="mt-1 block w-full"
                                                        value={profileData.name}
                                                        onChange={(e) =>
                                                            setProfileData((prev) => ({
                                                                ...prev,
                                                                name: e.target.value,
                                                            }))
                                                        }
                                                        required
                                                    />
                                                    <InputError message={profileErrors.name} className="mt-1" />
                                                </div>
                                                <div>
                                                    <InputLabel value="Mobile" />
                                                    <TextInput
                                                        className="mt-1 block w-full"
                                                        value={profileData.mobile}
                                                        onChange={(e) =>
                                                            setProfileData((prev) => ({
                                                                ...prev,
                                                                mobile: e.target.value,
                                                            }))
                                                        }
                                                    />
                                                    <InputError message={profileErrors.mobile} className="mt-1" />
                                                </div>
                                                </div>
                                                <div>
                                                    <InputLabel value="Address" />
                                                    <textarea
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                        rows={4}
                                                        value={profileData.address}
                                                        onChange={(e) =>
                                                            setProfileData((prev) => ({
                                                                ...prev,
                                                                address: e.target.value,
                                                            }))
                                                        }
                                                    />
                                                    <InputError message={profileErrors.address} className="mt-1" />
                                                </div>
                                                <div className="sm:max-w-xs">
                                                    <InputLabel value="State Code" />
                                                    <TextInput
                                                        className="mt-1 block w-full"
                                                        value={profileData.state_code}
                                                        onChange={(e) =>
                                                            setProfileData((prev) => ({
                                                                ...prev,
                                                                state_code: e.target.value,
                                                            }))
                                                        }
                                                        placeholder="e.g. 27"
                                                    />
                                                    <InputError
                                                        message={profileErrors.state_code}
                                                        className="mt-1"
                                                    />
                                                </div>

                                                <div className="flex flex-wrap gap-3 pt-2">
                                                    <PrimaryButton disabled={profileProcessing}>
                                                        Save Profile
                                                    </PrimaryButton>
                                                    <SecondaryButton
                                                        type="button"
                                                        onClick={() => void destroyParty()}
                                                    >
                                                        Delete Party
                                                    </SecondaryButton>
                                                </div>
                                            </form>
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
                <div className="p-6">
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

function LedgerTable({ rows, compact = false }: { rows: PartyLedgerEntry[]; compact?: boolean }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Particulars</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Reference</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Debit</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Credit</th>
                        {!compact && (
                            <th className="px-4 py-3 text-right font-medium text-gray-500">Balance</th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {rows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={compact ? 5 : 6}
                                className="px-6 py-8 text-center text-gray-500"
                            >
                                No ledger entries yet.
                            </td>
                        </tr>
                    ) : (
                        rows.map((row, index) => (
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
                                    {row.invoice_id ? (
                                        <Link
                                            href={route('invoices.show', row.invoice_id)}
                                            className="text-indigo-600 hover:underline"
                                        >
                                            {row.reference}
                                        </Link>
                                    ) : (
                                        row.reference || '—'
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {row.debit > 0 ? `₹ ${formatMoney(row.debit)}` : '—'}
                                </td>
                                <td className="px-4 py-3 text-right text-green-700">
                                    {row.credit > 0 ? `₹ ${formatMoney(row.credit)}` : '—'}
                                </td>
                                {!compact && (
                                    <td className="px-4 py-3 text-right font-medium">
                                        ₹ {formatMoney(row.balance)}
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

function EntrybooksTable({
    rows,
    compact = false,
}: {
    rows: PartyEntrybookRow[];
    compact?: boolean;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Entry No.</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                        {!compact && (
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Vehicle</th>
                        )}
                        <th className="px-4 py-3 text-left font-medium text-gray-500">From</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Freight</th>
                        {!compact && (
                            <th className="px-4 py-3 text-right font-medium text-gray-500">Advance</th>
                        )}
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Balance</th>
                        {!compact && (
                            <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {rows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={compact ? 5 : 8}
                                className="px-6 py-8 text-center text-gray-500"
                            >
                                No entrybook records for this party.
                            </td>
                        </tr>
                    ) : (
                        rows.map((row) => (
                            <tr key={row.id}>
                                <td className="px-4 py-3 font-mono font-medium">{row.entry_number}</td>
                                <td className="px-4 py-3">{formatAppDateTime(row.entry_date)}</td>
                                {!compact && (
                                    <td className="px-4 py-3 font-mono">{row.vehicle_number || '—'}</td>
                                )}
                                <td className="px-4 py-3">{row.route_from || '—'}</td>
                                <td className="px-4 py-3 text-right">
                                    ₹ {formatMoney(row.freight)}
                                </td>
                                {!compact && (
                                    <td className="px-4 py-3 text-right">
                                        ₹ {formatMoney(row.advance)}
                                    </td>
                                )}
                                <td className="px-4 py-3 text-right font-medium">
                                    ₹ {formatMoney(row.balance)}
                                </td>
                                {!compact && (
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={route('entrybooks.edit', row.id)}
                                            className="text-indigo-600 hover:underline"
                                        >
                                            Edit
                                        </Link>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

function InvoicesTable({
    rows,
    compact = false,
}: {
    rows: PartyInvoiceRow[];
    compact?: boolean;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Bill No</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Payment</th>
                        {!compact && (
                            <th className="px-4 py-3 text-right font-medium text-gray-500">Net Value</th>
                        )}
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Due</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Received</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Outstanding</th>
                        {!compact && (
                            <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {rows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={compact ? 6 : 8}
                                className="px-6 py-8 text-center text-gray-500"
                            >
                                No invoices for this party.
                            </td>
                        </tr>
                    ) : (
                        rows.map((row) => (
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
                                {!compact && (
                                    <td className="px-4 py-3 text-right">
                                        ₹ {formatMoney(row.net_value)}
                                    </td>
                                )}
                                <td className="px-4 py-3 text-right">
                                    ₹ {formatMoney(row.balance_amount)}
                                </td>
                                <td className="px-4 py-3 text-right text-green-700">
                                    ₹ {formatMoney(row.received)}
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-indigo-700">
                                    ₹ {formatMoney(row.outstanding)}
                                </td>
                                {!compact && (
                                    <td className="whitespace-nowrap px-4 py-3 text-right">
                                        <Link
                                            href={route('invoices.show', row.id)}
                                            className="text-indigo-600 hover:underline"
                                        >
                                            View
                                        </Link>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

function PaymentsTable({ rows }: { rows: PartyAccountData['payments'] }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Bill No</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Amount</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Mode</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Reference</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                No payments recorded for this party.
                            </td>
                        </tr>
                    ) : (
                        rows.map((row) => (
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
                                <td className="px-4 py-3 text-right">
                                    <Link
                                        href={route('invoice-payments.edit', row.id)}
                                        className="text-indigo-600 hover:underline"
                                    >
                                        Edit
                                    </Link>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
