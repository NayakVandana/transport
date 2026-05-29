import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import MasterDataSelect from '@/Components/MasterDataSelect';
import { usePageHeader } from '@/hooks/usePageHeader';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { balanceInWords } from '@/lib/amountInWords';
import {
    calculateFreightInvoice,
    lineFreight,
} from '@/lib/freightCalculator';
import { masterListHref } from '@/lib/invoiceReturn';
import { formatEntryNumber, todayDate } from '@/lib/quickAdd';
import type {
    Company,
    Customer,
    FreightInvoice,
    FreightInvoiceLine,
    RouteLocation,
    Vehicle,
} from '@/types/transport';
import { Head, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

interface EntrySettings {
    prefix: string;
    nextSequence: number;
}

type InvoiceMetaData = {
    company: Company;
    customers: Customer[];
    vehicles: Vehicle[];
    routeLocations: RouteLocation[];
    entrySettings: EntrySettings;
    nextBillNumber: string | null;
};

function buildEmptyLine(
    entrySettings: EntrySettings,
    lineIndex: number,
    existing?: FreightInvoiceLine,
): FreightInvoiceLine {
    if (existing) {
        return {
            ...existing,
            entry_date: existing.entry_date?.slice(0, 10) ?? todayDate(),
        };
    }

    return {
        entry_number: formatEntryNumber(
            entrySettings.prefix,
            entrySettings.nextSequence + lineIndex,
        ),
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

function apiFieldErrors(data: unknown): Record<string, string> {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return {};
    }

    const errors: Record<string, string> = {};
    for (const [key, val] of Object.entries(data)) {
        if (Array.isArray(val) && val[0]) {
            errors[key] = String(val[0]);
        } else if (typeof val === 'string') {
            errors[key] = val;
        }
    }

    return errors;
}

export default function InvoiceForm({ invoiceId }: { invoiceId?: number }) {
    const isEdit = Boolean(invoiceId);
    const [company, setCompany] = useState<Company | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [routes, setRoutes] = useState<RouteLocation[]>([]);
    const [entrySettings, setEntrySettings] = useState<EntrySettings>({
        prefix: 'R2526',
        nextSequence: 1769,
    });
    const [billNumber, setBillNumber] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [data, setData] = useState({
        customer_id: '',
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
                    const settings = meta.entrySettings;

                    setCompany(invoice.company ?? meta.company);
                    setCustomers(meta.customers);
                    setVehicles(meta.vehicles);
                    setRoutes(meta.routeLocations);
                    setEntrySettings(settings);
                    setBillNumber(invoice.bill_number);

                    setData({
                        customer_id: String(invoice.customer_id),
                        bill_number: invoice.bill_number,
                        invoice_date: invoice.invoice_date?.slice(0, 10) ?? todayDate(),
                        sac_code: invoice.sac_code ?? meta.company.sac_code,
                        status: invoice.status ?? 'draft',
                        prepared_by: invoice.prepared_by ?? '',
                        checked_by: invoice.checked_by ?? '',
                        lines: invoice.lines?.length
                            ? invoice.lines.map((line, i) =>
                                  buildEmptyLine(settings, i, line),
                              )
                            : [buildEmptyLine(settings, 0)],
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
                    const settings = meta.entrySettings;

                    setCompany(meta.company);
                    setCustomers(meta.customers);
                    setVehicles(meta.vehicles);
                    setRoutes(meta.routeLocations);
                    setEntrySettings(settings);
                    setBillNumber(meta.nextBillNumber ?? '');

                    setData({
                        customer_id: String(meta.customers[0]?.id ?? ''),
                        bill_number: meta.nextBillNumber ?? '',
                        invoice_date: todayDate(),
                        sac_code: meta.company.sac_code,
                        status: 'draft',
                        prepared_by: '',
                        checked_by: '',
                        lines: [buildEmptyLine(settings, 0)],
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
                customer_id: Number(data.customer_id),
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
                if (!res.data) {
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

    const addLine = () => {
        const nextIndex = data.lines.length;
        setField('lines', [...data.lines, buildEmptyLine(entrySettings, nextIndex)]);
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

    const vehiclesHref = masterListHref('vehicles.index', isEdit, invoiceId);
    const routesHref = masterListHref('routes.index', isEdit, invoiceId);

    usePageHeader(
        <h2 className="text-xl font-semibold text-gray-800">
            {isEdit ? `Edit ${billNumber}` : 'New Tax Invoice'}
        </h2>,
        [isEdit, billNumber],
    );

    return (
        <>
            <Head title="Invoice" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {loading ? (
                        <p className="text-center text-sm text-gray-500">Loading…</p>
                    ) : loadError ? (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {loadError}
                        </p>
                    ) : (
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid gap-4 rounded-lg bg-white p-6 shadow sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <InputLabel value="Customer" />
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        value={data.customer_id}
                                        onChange={(e) => setField('customer_id', e.target.value)}
                                        required
                                    >
                                        {customers.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.customer_id} />
                                </div>
                                <div>
                                    <InputLabel value="Bill Number" />
                                    <input
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        value={data.bill_number}
                                        onChange={(e) => setField('bill_number', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.bill_number} />
                                </div>
                                <div>
                                    <InputLabel value="Invoice Date" />
                                    <input
                                        type="date"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        value={data.invoice_date}
                                        onChange={(e) => setField('invoice_date', e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Status" />
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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
                            </div>

                            <p className="text-xs text-gray-500">
                                Entry numbers use prefix{' '}
                                <strong>{entrySettings.prefix}</strong> (configure in{' '}
                                <a href={route('company.edit')} className="text-indigo-600 underline">
                                    Company
                                </a>
                                ). Line date defaults to today. If a vehicle or route is not
                                listed, choose &quot;+ Add&quot; to open its form, then return here.
                            </p>

                            <div className="overflow-x-auto rounded-lg bg-white p-4 shadow">
                                <table className="min-w-full text-xs">
                                    <thead>
                                        <tr className="border-b text-left text-gray-500">
                                            <th className="w-8 p-2">#</th>
                                            <th className="min-w-[7rem] p-2">Entry No</th>
                                            <th className="min-w-[8rem] p-2">Date</th>
                                            <th className="min-w-[9rem] p-2">Vehicle</th>
                                            <th className="min-w-[11rem] p-2">From</th>
                                            <th className="p-2">Product</th>
                                            <th className="p-2">Wt</th>
                                            <th className="p-2">Rate</th>
                                            <th className="p-2">Freight</th>
                                            <th className="p-2">Advance</th>
                                            <th className="p-2">Empty Cntr</th>
                                            <th className="w-8 p-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.lines.map((line, i) => (
                                            <tr key={i} className="border-b align-top">
                                                <td className="p-2">{i + 1}</td>
                                                <td className="p-2">
                                                    <input
                                                        className="w-full min-w-[6.5rem] rounded border-gray-300 font-mono text-xs"
                                                        value={line.entry_number ?? ''}
                                                        onChange={(e) =>
                                                            updateLine(i, 'entry_number', e.target.value)
                                                        }
                                                        placeholder="R2526-1767"
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="date"
                                                        className="w-full rounded border-gray-300"
                                                        value={line.entry_date?.slice(0, 10) ?? todayDate()}
                                                        onChange={(e) =>
                                                            updateLine(i, 'entry_date', e.target.value)
                                                        }
                                                    />
                                                </td>
                                                <td className="min-w-[9rem] p-2">
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
                                                </td>
                                                <td className="min-w-[11rem] p-2">
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
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        className="w-28 rounded border-gray-300"
                                                        value={line.product_name ?? ''}
                                                        onChange={(e) =>
                                                            updateLine(i, 'product_name', e.target.value)
                                                        }
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        step="0.001"
                                                        className="w-16 rounded border-gray-300"
                                                        value={line.weight}
                                                        onChange={(e) =>
                                                            updateLine(i, 'weight', e.target.value)
                                                        }
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="w-24 rounded border-gray-300"
                                                        value={line.rate}
                                                        onChange={(e) =>
                                                            updateLine(i, 'rate', e.target.value)
                                                        }
                                                    />
                                                </td>
                                                <td className="whitespace-nowrap p-2 pt-3 text-right">
                                                    {lineFreight(line.weight, line.rate).toFixed(2)}
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        className="w-24 rounded border-gray-300"
                                                        value={line.advance_paid ?? 0}
                                                        onChange={(e) =>
                                                            updateLine(i, 'advance_paid', e.target.value)
                                                        }
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        className="w-24 rounded border-gray-300"
                                                        value={line.empty_container_charge ?? 0}
                                                        onChange={(e) =>
                                                            updateLine(
                                                                i,
                                                                'empty_container_charge',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeLine(i)}
                                                        className="text-red-600"
                                                    >
                                                        ×
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <SecondaryButton type="button" onClick={addLine} className="mt-3">
                                    Add Line
                                </SecondaryButton>
                            </div>

                            <div className="rounded-lg bg-gray-50 p-4 text-sm">
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                    <p>Net Value: ₹ {totals.net_value.toFixed(2)}</p>
                                    <p>Total Advance: ₹ {totals.total_advance.toFixed(2)}</p>
                                    <p>Balance: ₹ {totals.balance_amount.toFixed(2)}</p>
                                    <p>IGST ({igstRate}%): ₹ {totals.igst_amount.toFixed(2)}</p>
                                </div>
                                <p className="mt-2 text-xs text-gray-600">
                                    {balanceInWords(totals.balance_amount)}
                                </p>
                            </div>

                            <PrimaryButton disabled={processing}>
                                {isEdit ? 'Update Invoice' : 'Create Invoice'}
                            </PrimaryButton>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}
