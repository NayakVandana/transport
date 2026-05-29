import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import MasterDataSelect from '@/Components/MasterDataSelect';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo } from 'react';

interface EntrySettings {
    prefix: string;
    nextSequence: number;
}

interface Props {
    invoice: FreightInvoice | null;
    company: Company;
    customers: Customer[];
    vehicles: Vehicle[];
    routeLocations: RouteLocation[];
    entrySettings: EntrySettings;
    nextBillNumber: string | null;
}

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

export default function InvoiceForm({
    invoice,
    company,
    customers,
    vehicles,
    routeLocations: routes,
    entrySettings,
    nextBillNumber,
}: Props) {
    const isEdit = Boolean(invoice);
    const invoiceId = invoice?.id;

    const initialLines = useMemo(() => {
        if (invoice?.lines?.length) {
            return invoice.lines.map((line, i) =>
                buildEmptyLine(entrySettings, i, line),
            );
        }
        return [buildEmptyLine(entrySettings, 0)];
    }, [invoice, entrySettings]);

    const { data, setData, post, put, processing, errors, transform } = useForm({
        customer_id: String(invoice?.customer_id ?? customers[0]?.id ?? ''),
        bill_number: invoice?.bill_number ?? nextBillNumber ?? '',
        invoice_date:
            invoice?.invoice_date?.slice(0, 10) ?? todayDate(),
        sac_code: invoice?.sac_code ?? company.sac_code,
        status: invoice?.status ?? 'draft',
        prepared_by: invoice?.prepared_by ?? '',
        checked_by: invoice?.checked_by ?? '',
        lines: initialLines as FreightInvoiceLine[],
    });

    transform((formData) => ({
        ...formData,
        customer_id: Number(formData.customer_id),
    }));

    const igstRate = Number(company.igst_rate) || 5;
    const totals = useMemo(
        () => calculateFreightInvoice(data.lines, igstRate),
        [data.lines, igstRate],
    );

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEdit && invoice) {
            put(route('invoices.update', invoice.id));
        } else {
            post(route('invoices.store'));
        }
    };

    const updateLine = (
        index: number,
        field: keyof FreightInvoiceLine,
        value: string | number,
    ) => {
        const lines = [...data.lines];
        lines[index] = { ...lines[index], [field]: value };
        setData('lines', lines);
    };

    const addLine = () => {
        const nextIndex = data.lines.length;
        setData('lines', [
            ...data.lines,
            buildEmptyLine(entrySettings, nextIndex),
        ]);
    };

    const removeLine = (index: number) => {
        if (data.lines.length <= 1) return;
        setData(
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

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold text-gray-800">
                    {isEdit ? `Edit ${invoice?.bill_number}` : 'New Tax Invoice'}
                </h2>
            }
        >
            <Head title="Invoice" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-4 rounded-lg bg-white p-6 shadow sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <InputLabel value="Customer" />
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    value={data.customer_id}
                                    onChange={(e) => setData('customer_id', e.target.value)}
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
                                    onChange={(e) => setData('bill_number', e.target.value)}
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
                                    onChange={(e) => setData('invoice_date', e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <InputLabel value="Status" />
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    value={data.status}
                                    onChange={(e) =>
                                        setData('status', e.target.value as 'draft' | 'finalized')
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
                                        <th className="p-2 w-8">#</th>
                                        <th className="p-2 min-w-[7rem]">Entry No</th>
                                        <th className="p-2 min-w-[8rem]">Date</th>
                                        <th className="p-2 min-w-[9rem]">Vehicle</th>
                                        <th className="p-2 min-w-[11rem]">From</th>
                                        <th className="p-2">Product</th>
                                        <th className="p-2">Wt</th>
                                        <th className="p-2">Rate</th>
                                        <th className="p-2">Freight</th>
                                        <th className="p-2">Advance</th>
                                        <th className="p-2">Empty Cntr</th>
                                        <th className="p-2 w-8"></th>
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
                                            <td className="p-2 min-w-[9rem]">
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
                                            <td className="p-2 min-w-[11rem]">
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
                                            <td className="p-2 text-right whitespace-nowrap pt-3">
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
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
