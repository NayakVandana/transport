import { DetailPageHeader, HeaderSecondaryButton } from '@/Components/ListPageHeader';
import FormPage, { FormActions, FormCard, FormGrid, FormSectionHeader } from '@/Components/FormPage';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import MasterDataSelect from '@/Components/MasterDataSelect';
import { usePageHeader } from '@/hooks/usePageHeader';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { apiFieldErrors, fieldInputClass, hasApiFieldErrors } from '@/lib/apiFormErrors';
import { balanceInWords } from '@/lib/amountInWords';
import {
    calculateFreightInvoice,
    formatMoney,
    lineFreight,
} from '@/lib/freightCalculator';
import { invoiceReturnQuery, masterListHref } from '@/lib/invoiceReturn';
import { todayDate } from '@/lib/quickAdd';
import type {
    Company,
    Party,
    Entrybook,
    FreightInvoice,
    FreightInvoiceLine,
    RouteLocation,
    Vehicle,
} from '@/types/transport';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

interface EntrySettings {
    prefix: string;
    nextSequence: number;
}

type InvoiceMetaData = {
    company: Company;
    parties: Party[];
    vehicles: Vehicle[];
    routeLocations: RouteLocation[];
    entrybooks: Entrybook[];
    entrySettings?: EntrySettings;
    nextBillNumber: string | null;
};

function buildEmptyLine(existing?: FreightInvoiceLine): FreightInvoiceLine {
    if (existing) {
        return {
            ...existing,
            entry_date: existing.entry_date?.slice(0, 10) ?? todayDate(),
        };
    }

    return {
        entrybook_id: null,
        entry_number: '',
        entry_date: todayDate(),
        vehicle_number: '',
        route_from: '',
        product_name: 'AS PER INVOICES',
        weight: 1,
        rate: 0,
        advance_paid: 0,
        empty_container_charge: 0,
    };
}

function applyEntrybookToLine(
    line: FreightInvoiceLine,
    entry: Entrybook,
): FreightInvoiceLine {
    return {
        ...line,
        entrybook_id: entry.id,
        entry_number: entry.entry_number,
        entry_date: entry.entry_date.slice(0, 10),
        vehicle_number: entry.vehicle?.vehicle_number ?? '',
        route_from: entry.route_from ?? '',
        rate: entry.freight,
        advance_paid: entry.advance,
        weight: line.weight || 1,
        product_name: line.product_name || 'AS PER INVOICES',
    };
}

export default function InvoiceForm({ invoiceId }: { invoiceId?: number }) {
    const isEdit = Boolean(invoiceId);
    const [company, setCompany] = useState<Company | null>(null);
    const [parties, setParties] = useState<Party[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [routes, setRoutes] = useState<RouteLocation[]>([]);
    const [entrybooks, setEntrybooks] = useState<Entrybook[]>([]);
    const [billNumber, setBillNumber] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [data, setData] = useState({
        party_id: '',
        bill_number: '',
        invoice_date: todayDate(),
        sac_code: '996791',
        status: 'draft' as 'draft' | 'finalized',
        prepared_by: '',
        checked_by: '',
        lines: [] as FreightInvoiceLine[],
    });

    useEffect(() => {
        setLoading(true);
        setLoadError(null);

        const load = async () => {
            try {
                if (invoiceId) {
                    const [showRes, metaRes] = await Promise.all([
                        appApiPost<ApiEnvelope<{ invoice: FreightInvoice }>>(
                            '/invoices/invoice-show',
                            { id: invoiceId },
                        ),
                        appApiPost<ApiEnvelope<InvoiceMetaData>>('/invoices/invoice-meta', {}),
                    ]);

                    if (!showRes.success || !showRes.data?.invoice) {
                        setLoadError(showRes.message || 'Could not load invoice.');
                        return;
                    }

                    if (!metaRes.success || !metaRes.data) {
                        setLoadError(metaRes.message || 'Could not load form data.');
                        return;
                    }

                    const invoice = showRes.data.invoice;
                    const meta = metaRes.data;

                    setCompany(invoice.company ?? meta.company);
                    setParties(meta.parties);
                    setVehicles(meta.vehicles);
                    setRoutes(meta.routeLocations);
                    setEntrybooks(meta.entrybooks ?? []);
                    setBillNumber(invoice.bill_number);

                    setData({
                        party_id: String(invoice.party_id),
                        bill_number: invoice.bill_number,
                        invoice_date: invoice.invoice_date?.slice(0, 10) ?? todayDate(),
                        sac_code: invoice.sac_code ?? meta.company.sac_code,
                        status: invoice.status ?? 'draft',
                        prepared_by: invoice.prepared_by ?? '',
                        checked_by: invoice.checked_by ?? '',
                        lines: invoice.lines?.length
                            ? invoice.lines.map((line) => buildEmptyLine(line))
                            : [buildEmptyLine()],
                    });
                } else {
                    const metaRes = await appApiPost<ApiEnvelope<InvoiceMetaData>>(
                        '/invoices/invoice-meta',
                        {},
                    );

                    if (!metaRes.success || !metaRes.data) {
                        setLoadError(
                            metaRes.message ||
                                'Set up your company profile before creating invoices.',
                        );
                        return;
                    }

                    const meta = metaRes.data;

                    setCompany(meta.company);
                    setParties(meta.parties);
                    setVehicles(meta.vehicles);
                    setRoutes(meta.routeLocations);
                    setEntrybooks(meta.entrybooks ?? []);
                    setBillNumber(meta.nextBillNumber ?? '');

                    setData({
                        party_id: String(meta.parties[0]?.id ?? ''),
                        bill_number: meta.nextBillNumber ?? '',
                        invoice_date: todayDate(),
                        sac_code: meta.company.sac_code,
                        status: 'draft',
                        prepared_by: '',
                        checked_by: '',
                        lines: [buildEmptyLine()],
                    });
                }
            } catch {
                setLoadError('Could not load invoice form.');
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [invoiceId]);

    const igstRate = Number(company?.igst_rate) || 5;
    const totals = useMemo(
        () => calculateFreightInvoice(data.lines, igstRate),
        [data.lines, igstRate],
    );

    const setField = <K extends keyof typeof data>(field: K, value: (typeof data)[K]) => {
        setData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[field as string];
            return next;
        });
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setErrors({});
        setProcessing(true);

        try {
            const payload = {
                party_id: Number(data.party_id),
                bill_number: data.bill_number,
                invoice_date: data.invoice_date,
                sac_code: data.sac_code,
                status: data.status,
                prepared_by: data.prepared_by || null,
                checked_by: data.checked_by || null,
                lines: data.lines,
                ...(invoiceId ? { id: invoiceId } : {}),
            };

            const res = await appApiPost<ApiEnvelope<{ invoice: FreightInvoice }>>(
                invoiceId ? '/invoices/invoice-update' : '/invoices/invoice-store',
                payload,
            );

            if (!res.success) {
                setErrors(apiFieldErrors(res.data));
                if (!hasApiFieldErrors(res.data)) {
                    setLoadError(res.message || 'Could not save invoice.');
                }
                return;
            }

            router.visit(route('invoices.index'));
        } catch {
            setLoadError('Could not save invoice.');
        } finally {
            setProcessing(false);
        }
    };

    const updateLine = (
        index: number,
        field: keyof FreightInvoiceLine,
        value: string | number,
    ) => {
        const lines = [...data.lines];
        lines[index] = { ...lines[index], [field]: value };
        setField('lines', lines);
    };

    const partyEntrybooks = useMemo(
        () =>
            data.party_id
                ? entrybooks.filter((e) => String(e.party_id) === data.party_id)
                : [],
        [entrybooks, data.party_id],
    );

    const selectEntryNumber = (index: number, entryNumber: string) => {
        if (!entryNumber) {
            const lines = [...data.lines];
            lines[index] = { ...lines[index], entry_number: '', entrybook_id: null };
            setField('lines', lines);
            return;
        }

        const entry = partyEntrybooks.find((e) => e.entry_number === entryNumber);
        if (!entry) {
            const lines = [...data.lines];
            lines[index] = { ...lines[index], entry_number: entryNumber, entrybook_id: null };
            setField('lines', lines);
            return;
        }

        const lines = [...data.lines];
        lines[index] = applyEntrybookToLine(lines[index], entry);
        setField('lines', lines);
    };

    const addLine = () => {
        setField('lines', [...data.lines, buildEmptyLine()]);
    };

    const removeLine = (index: number) => {
        if (data.lines.length <= 1) return;
        setField(
            'lines',
            data.lines.filter((_, i) => i !== index),
        );
    };

    const vehicleOptions = useMemo(
        () => vehicles.map((v) => ({ value: v.vehicle_number, label: v.vehicle_number })),
        [vehicles],
    );

    const routeOptions = useMemo(
        () => routes.map((r) => ({ value: r.name, label: r.name })),
        [routes],
    );

    const changeParty = (partyId: string) => {
        setData((prev) => {
            const lines = prev.lines.map((line) => {
                if (!line.entrybook_id) {
                    return line;
                }

                const entry = entrybooks.find((e) => e.id === line.entrybook_id);
                if (entry && String(entry.party_id) === partyId) {
                    return line;
                }

                return {
                    ...buildEmptyLine(),
                    weight: line.weight,
                    product_name: line.product_name || 'AS PER INVOICES',
                };
            });

            return { ...prev, party_id: partyId, lines };
        });

        setErrors((prev) => {
            const next = { ...prev };
            delete next.party_id;
            return next;
        });
    };

    const entrybookOptions = useMemo(
        () =>
            partyEntrybooks.map((e) => ({
                value: e.entry_number,
                label: e.entry_number,
            })),
        [partyEntrybooks],
    );

    const entryOptionsForLine = (lineIndex: number, currentValue: string) => {
        const used = new Set(
            data.lines
                .map((line, i) => (i !== lineIndex ? line.entry_number : ''))
                .filter(Boolean),
        );

        return entrybookOptions.filter(
            (option) => option.value === currentValue || !used.has(option.value),
        );
    };

    const vehiclesHref = masterListHref('vehicles.index', isEdit, invoiceId);
    const routesHref = masterListHref('routes.index', isEdit, invoiceId);
    const entrybooksHref = route('entrybooks.create', invoiceReturnQuery(isEdit, invoiceId));

    usePageHeader(
        <DetailPageHeader
            title={isEdit ? `Edit ${billNumber}` : 'New Tax Invoice'}
            actions={
                <HeaderSecondaryButton
                    href={route('invoices.index')}
                    label="Back to list"
                    mobileLabel="Back"
                />
            }
        />,
        [isEdit, billNumber],
    );

    const inputClass = (field: string) =>
        fieldInputClass(
            Boolean(errors[field]),
            'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500',
        );

    return (
        <>
            <Head title={isEdit ? `Edit ${billNumber}` : 'New Tax Invoice'} />

            <FormPage size="lg">
                    {loading ? (
                        <p className="py-8 text-center text-sm text-gray-500">Loading…</p>
                    ) : loadError ? (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {loadError}
                        </p>
                    ) : (
                        <form onSubmit={submit} className="space-y-5">
                            <FormCard>
                                <FormSectionHeader
                                    title="Invoice details"
                                    description="Bill number and totals are calculated from the freight lines below."
                                />

                                <FormGrid cols={4}>
                                    <div>
                                        <InputLabel value="Party" />
                                        <select
                                            className={inputClass('party_id')}
                                            value={data.party_id}
                                            onChange={(e) => changeParty(e.target.value)}
                                        >
                                            <option value="">Select party</option>
                                            {parties.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.party_id} className="mt-1" />
                                    </div>
                                    <div>
                                        <InputLabel value="Bill number" />
                                        <TextInput
                                            className={inputClass('bill_number')}
                                            value={data.bill_number}
                                            onChange={(e) => setField('bill_number', e.target.value)}
                                        />
                                        <InputError message={errors.bill_number} className="mt-1" />
                                    </div>
                                    <div>
                                        <InputLabel value="Invoice date" />
                                        <TextInput
                                            type="date"
                                            className={inputClass('invoice_date')}
                                            value={data.invoice_date}
                                            onChange={(e) => setField('invoice_date', e.target.value)}
                                        />
                                        <InputError message={errors.invoice_date} className="mt-1" />
                                    </div>
                                    <div>
                                        <InputLabel value="Status" />
                                        <select
                                            className={inputClass('status')}
                                            value={data.status}
                                            onChange={(e) =>
                                                setField(
                                                    'status',
                                                    e.target.value as 'draft' | 'finalized',
                                                )
                                            }
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="finalized">Finalized</option>
                                        </select>
                                    </div>
                                    <div>
                                        <InputLabel value="SAC code" />
                                        <TextInput
                                            className={inputClass('sac_code')}
                                            value={data.sac_code}
                                            onChange={(e) => setField('sac_code', e.target.value)}
                                        />
                                        <InputError message={errors.sac_code} className="mt-1" />
                                    </div>
                                    <div>
                                        <InputLabel value="Prepared by" />
                                        <TextInput
                                            className={inputClass('prepared_by')}
                                            value={data.prepared_by}
                                            onChange={(e) => setField('prepared_by', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="Checked by" />
                                        <TextInput
                                            className={inputClass('checked_by')}
                                            value={data.checked_by}
                                            onChange={(e) => setField('checked_by', e.target.value)}
                                        />
                                    </div>
                                </FormGrid>
                            </FormCard>

                            <FormCard>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <FormSectionHeader
                                        title="Freight lines"
                                        description={
                                            data.party_id
                                                ? partyEntrybooks.length > 0
                                                    ? 'Select an entrybook row to auto-fill vehicle, route, and amounts.'
                                                    : 'No entrybook records for this party yet — add fields manually or create an entry.'
                                                : 'Select a party first to see their entrybook entries.'
                                        }
                                    />
                                    <SecondaryButton
                                        type="button"
                                        onClick={addLine}
                                        className="w-full shrink-0 sm:w-auto"
                                    >
                                        + Add line
                                    </SecondaryButton>
                                </div>

                                <div className="mt-4 space-y-4">
                                    {data.lines.map((line, i) => (
                                        <div
                                            key={i}
                                            className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 sm:p-4"
                                        >
                                            <div className="mb-4 flex items-center justify-between gap-2">
                                                <span className="text-sm font-medium text-gray-800">
                                                    Line {i + 1}
                                                </span>
                                                {data.lines.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeLine(i)}
                                                        className="text-sm text-red-600 hover:underline"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <InputLabel value="Entry no." />
                                                    <MasterDataSelect
                                                        value={line.entry_number ?? ''}
                                                        options={entryOptionsForLine(
                                                            i,
                                                            line.entry_number ?? '',
                                                        )}
                                                        emptyLabel="Select entry or enter manually below"
                                                        addLabel="+ Add entry"
                                                        addHref={entrybooksHref}
                                                        onChange={(v) => selectEntryNumber(i, v)}
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                                    <div>
                                                        <InputLabel value="Date" />
                                                        <TextInput
                                                            type="date"
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                                            value={
                                                                line.entry_date?.slice(0, 10) ??
                                                                todayDate()
                                                            }
                                                            onChange={(e) =>
                                                                updateLine(
                                                                    i,
                                                                    'entry_date',
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputLabel value="Vehicle" />
                                                        <MasterDataSelect
                                                            value={line.vehicle_number ?? ''}
                                                            options={vehicleOptions}
                                                            emptyLabel="Select vehicle"
                                                            addLabel="+ Add vehicle"
                                                            addHref={vehiclesHref}
                                                            onChange={(v) =>
                                                                updateLine(i, 'vehicle_number', v)
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputLabel value="From (route)" />
                                                        <MasterDataSelect
                                                            value={line.route_from ?? ''}
                                                            options={routeOptions}
                                                            emptyLabel="Select route"
                                                            addLabel="+ Add route"
                                                            addHref={routesHref}
                                                            onChange={(v) =>
                                                                updateLine(i, 'route_from', v)
                                                            }
                                                        />
                                                    </div>
                                                    <div className="sm:col-span-2 lg:col-span-3">
                                                        <InputLabel value="Product name" />
                                                        <TextInput
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                                            value={line.product_name ?? ''}
                                                            onChange={(e) =>
                                                                updateLine(
                                                                    i,
                                                                    'product_name',
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputLabel value="Weight" />
                                                        <TextInput
                                                            type="number"
                                                            min="0"
                                                            step="0.001"
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                                            value={line.weight}
                                                            onChange={(e) =>
                                                                updateLine(i, 'weight', e.target.value)
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputLabel value="Rate" />
                                                        <TextInput
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                                            value={line.rate}
                                                            onChange={(e) =>
                                                                updateLine(i, 'rate', e.target.value)
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputLabel value="Freight" />
                                                        <TextInput
                                                            readOnly
                                                            disabled
                                                            className="mt-1 block w-full cursor-not-allowed rounded-md border-gray-200 bg-white text-gray-700 shadow-sm"
                                                            value={formatMoney(
                                                                lineFreight(line.weight, line.rate),
                                                            )}
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputLabel value="Advance" />
                                                        <TextInput
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                                            value={line.advance_paid ?? 0}
                                                            onChange={(e) =>
                                                                updateLine(
                                                                    i,
                                                                    'advance_paid',
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputLabel value="Empty container charge" />
                                                        <TextInput
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                                            value={line.empty_container_charge ?? 0}
                                                            onChange={(e) =>
                                                                updateLine(
                                                                    i,
                                                                    'empty_container_charge',
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </FormCard>

                            <FormCard className="border border-gray-200 bg-gray-50">
                                <FormSectionHeader title="Summary" />
                                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                                    <div className="flex justify-between gap-4 sm:block">
                                        <dt className="text-gray-500">Total weight</dt>
                                        <dd className="font-medium">
                                            {totals.total_weight.toFixed(3)}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-4 sm:block">
                                        <dt className="text-gray-500">Total freight</dt>
                                        <dd className="font-medium">
                                            ₹ {formatMoney(totals.total_freight)}
                                        </dd>
                                    </div>
                                    {totals.total_empty_container_charge > 0 && (
                                        <div className="flex justify-between gap-4 sm:block">
                                            <dt className="text-gray-500">Empty container</dt>
                                            <dd className="font-medium">
                                                ₹ {formatMoney(totals.total_empty_container_charge)}
                                            </dd>
                                        </div>
                                    )}
                                    <div className="flex justify-between gap-4 sm:block">
                                        <dt className="text-gray-500">Net value</dt>
                                        <dd className="font-medium">
                                            ₹ {formatMoney(totals.net_value)}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-4 sm:block">
                                        <dt className="text-gray-500">Total advance</dt>
                                        <dd className="font-medium">
                                            ₹ {formatMoney(totals.total_advance)}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-4 sm:block">
                                        <dt className="text-gray-500">Balance</dt>
                                        <dd className="font-semibold text-indigo-700">
                                            ₹ {formatMoney(totals.balance_amount)}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-4 sm:block">
                                        <dt className="text-gray-500">IGST ({igstRate}%)</dt>
                                        <dd className="font-medium">
                                            ₹ {formatMoney(totals.igst_amount)}
                                        </dd>
                                    </div>
                                </dl>
                                <p className="mt-3 border-t border-gray-200 pt-3 text-xs text-gray-600">
                                    {balanceInWords(totals.balance_amount)}
                                </p>
                            </FormCard>

                            <FormActions>
                                <PrimaryButton disabled={processing}>
                                    {processing
                                        ? 'Saving…'
                                        : isEdit
                                          ? 'Update invoice'
                                          : 'Create invoice'}
                                </PrimaryButton>
                                <Link href={route('invoices.index')}>
                                    <SecondaryButton type="button">Cancel</SecondaryButton>
                                </Link>
                            </FormActions>
                        </form>
                    )}
            </FormPage>
        </>
    );
}
