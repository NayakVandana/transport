import RouteLocationFields from '@/Components/RouteLocationFields';
import { FormPageHeader } from '@/Components/ListPageHeader';
import FormPage, { FormActions, FormCard, FormField, FormGrid, FormSectionHeader, formControlClass, formSelectClass } from '@/Components/FormPage';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import MasterDataSelect from '@/Components/MasterDataSelect';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { usePageHeader } from '@/hooks/usePageHeader';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { apiFieldErrors, fieldInputClass, hasApiFieldErrors } from '@/lib/apiFormErrors';
import { formatMoney } from '@/lib/freightCalculator';
import { masterListHref } from '@/lib/invoiceReturn';
import {
    emptyLoadingSlipLine,
    lineBalance,
    slipTotals,
    validateLoadingSlipForm,
    type LoadingSlipFormData,
    type LoadingSlipLineDraft,
} from '@/lib/loadingSlipValidation';
import { todayDate } from '@/lib/quickAdd';
import type { Company, LoadingSlip, Location, Party, Vehicle } from '@/types/transport';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

type LoadingSlipMetaData = {
    company: Company | null;
    parties: Pick<Party, 'id' | 'name'>[];
    vehicles: Pick<Vehicle, 'id' | 'vehicle_number'>[];
    routes: Pick<Location, 'id' | 'name'>[];
};

type LoadingSlipShowData = {
    loadingSlip: LoadingSlip;
};

function slipToFormData(slip: LoadingSlip): LoadingSlipFormData {
    return {
        slip_date: slip.slip_date.slice(0, 10),
        loading_date: slip.loading_date?.slice(0, 10) ?? '',
        party_id: slip.party_id ? String(slip.party_id) : '',
        route_from: slip.route_from ?? '',
        route_to: slip.route_to ?? '',
        authorized_signatory: slip.authorized_signatory ?? '',
        lines:
            slip.lines && slip.lines.length > 0
                ? slip.lines.map((line) => ({
                      vehicle_id: line.vehicle_id ? String(line.vehicle_id) : '',
                      vehicle_number: line.vehicle_number ?? line.vehicle?.vehicle_number ?? '',
                      destination: line.destination ?? '',
                      freight_rate: line.freight_rate != null ? String(line.freight_rate) : '',
                      advance: line.advance != null ? String(line.advance) : '0',
                  }))
                : [emptyLoadingSlipLine()],
    };
}

export default function LoadingSlipForm({ loadingSlipId }: { loadingSlipId?: number }) {
    const isEdit = Boolean(loadingSlipId);

    usePageHeader(
        <FormPageHeader
            title={isEdit ? 'Edit Loading Slip' : 'New Loading Slip'}
            backHref={route('loading-slips.index')}
        />,
    );

    const [parties, setParties] = useState<Pick<Party, 'id' | 'name'>[]>([]);
    const [vehicles, setVehicles] = useState<Pick<Vehicle, 'id' | 'vehicle_number'>[]>([]);
    const [locations, setLocations] = useState<Pick<Location, 'id' | 'name'>[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [data, setData] = useState<LoadingSlipFormData>({
        slip_date: todayDate(),
        loading_date: todayDate(),
        party_id: '',
        route_from: '',
        route_to: '',
        authorized_signatory: '',
        lines: [emptyLoadingSlipLine()],
    });

    useEffect(() => {
        setLoading(true);
        setLoadError(null);

        const load = async () => {
            try {
                if (loadingSlipId) {
                    const res = await appApiPost<ApiEnvelope<LoadingSlipShowData>>(
                        '/loading-slips/loading-slip-show',
                        { id: loadingSlipId },
                    );

                    if (!res.success || !res.data?.loadingSlip) {
                        setLoadError(res.message || 'Could not load loading slip.');
                        return;
                    }

                    if (res.data.loadingSlip.freight_invoice_id) {
                        setLoadError('This loading slip is already invoiced and cannot be edited.');
                        return;
                    }

                    const metaRes = await appApiPost<ApiEnvelope<LoadingSlipMetaData>>(
                        '/loading-slips/loading-slip-meta',
                        {},
                    );

                    if (metaRes.success && metaRes.data) {
                        setParties(metaRes.data.parties);
                        setVehicles(metaRes.data.vehicles);
                        setLocations(metaRes.data.routes);
                    }

                    setData(slipToFormData(res.data.loadingSlip));
                } else {
                    const res = await appApiPost<ApiEnvelope<LoadingSlipMetaData>>(
                        '/loading-slips/loading-slip-meta',
                        {},
                    );

                    if (!res.success || !res.data) {
                        setLoadError(res.message || 'Could not load form data.');
                        return;
                    }

                    setParties(res.data.parties);
                    setVehicles(res.data.vehicles);
                    setLocations(res.data.routes);
                }
            } catch {
                setLoadError('Could not load form data.');
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [loadingSlipId]);

    const totals = useMemo(() => slipTotals(data.lines), [data.lines]);

    const locationOptions = useMemo(
        () => locations.map((location) => ({ value: location.name, label: location.name })),
        [locations],
    );

    const vehicleOptions = useMemo(
        () => vehicles.map((vehicle) => ({ value: vehicle.vehicle_number, label: vehicle.vehicle_number })),
        [vehicles],
    );

    const locationsHref = masterListHref('locations.index', isEdit, loadingSlipId, 'invoice');
    const vehiclesHref = route('vehicles.create');

    const setField = <K extends keyof LoadingSlipFormData>(field: K, value: LoadingSlipFormData[K]) => {
        setData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const updateLine = (index: number, field: keyof LoadingSlipLineDraft, value: string) => {
        setData((prev) => ({
            ...prev,
            lines: prev.lines.map((line, i) => (i === index ? { ...line, [field]: value } : line)),
        }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[`lines.${index}.${field}`];
            delete next.lines;
            return next;
        });
    };

    const selectVehicle = (index: number, vehicleNumber: string) => {
        const vehicle = vehicles.find((item) => item.vehicle_number === vehicleNumber);
        setData((prev) => ({
            ...prev,
            lines: prev.lines.map((line, i) =>
                i === index
                    ? {
                          ...line,
                          vehicle_id: vehicle ? String(vehicle.id) : '',
                          vehicle_number: vehicleNumber,
                      }
                    : line,
            ),
        }));
    };

    const addLine = () => {
        setData((prev) => ({ ...prev, lines: [...prev.lines, emptyLoadingSlipLine()] }));
    };

    const removeLine = (index: number) => {
        setData((prev) => ({
            ...prev,
            lines: prev.lines.length > 1 ? prev.lines.filter((_, i) => i !== index) : prev.lines,
        }));
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoadError(null);

        const clientErrors = validateLoadingSlipForm(data);
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            return;
        }

        setProcessing(true);

        try {
            const payload = {
                slip_date: data.slip_date,
                loading_date: data.loading_date || null,
                party_id: Number(data.party_id),
                route_from: data.route_from.trim(),
                route_to: data.route_to.trim(),
                authorized_signatory: data.authorized_signatory.trim() || null,
                lines: data.lines.map((line) => ({
                    vehicle_id: line.vehicle_id ? Number(line.vehicle_id) : null,
                    vehicle_number: line.vehicle_number.trim(),
                    destination: line.destination.trim(),
                    freight_rate: Number(line.freight_rate),
                    advance: Number(line.advance || 0),
                })),
                ...(loadingSlipId ? { id: loadingSlipId } : {}),
            };

            const res = await appApiPost<ApiEnvelope<{ loadingSlip: LoadingSlip }>>(
                loadingSlipId ? '/loading-slips/loading-slip-update' : '/loading-slips/loading-slip-store',
                payload,
            );

            if (!res.success) {
                setErrors(apiFieldErrors(res.data));
                if (!hasApiFieldErrors(res.data)) {
                    setLoadError(res.message || 'Could not save loading slip.');
                }
                return;
            }

            router.visit(route('loading-slips.show', res.data?.loadingSlip.id ?? loadingSlipId));
        } catch {
            setLoadError('Could not save loading slip.');
        } finally {
            setProcessing(false);
        }
    };

    const inputClass = (field: string) => fieldInputClass(Boolean(errors[field]), formControlClass);

    if (loading) {
        return (
            <>
                <Head title={isEdit ? 'Edit Loading Slip' : 'New Loading Slip'} />
                <p className="py-8 text-center text-sm text-gray-500">Loading…</p>
            </>
        );
    }

    return (
        <>
            <Head title={isEdit ? 'Edit Loading Slip' : 'New Loading Slip'} />

            <FormPage size="lg">
                {loadError ? (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {loadError}
                    </p>
                ) : (
                    <form onSubmit={submit} className="space-y-5">
                        <FormCard>
                            <FormSectionHeader
                                title="Slip details"
                                description="Header information shown on the loading slip printout."
                            />

                            <FormGrid cols={3}>
                                <FormField>
                                    <InputLabel value="Slip date" />
                                    <TextInput
                                        type="date"
                                        className={inputClass('slip_date')}
                                        value={data.slip_date}
                                        onChange={(e) => setField('slip_date', e.target.value)}
                                    />
                                    <InputError message={errors.slip_date} className="mt-1" />
                                </FormField>
                                <FormField>
                                    <InputLabel value="Loading date" />
                                    <TextInput
                                        type="date"
                                        className={inputClass('loading_date')}
                                        value={data.loading_date}
                                        onChange={(e) => setField('loading_date', e.target.value)}
                                    />
                                    <InputError message={errors.loading_date} className="mt-1" />
                                </FormField>
                                <FormField>
                                    <InputLabel value="Party (M/S)" />
                                    <select
                                        className={fieldInputClass(Boolean(errors.party_id), formSelectClass)}
                                        value={data.party_id}
                                        onChange={(e) => setField('party_id', e.target.value)}
                                    >
                                        <option value="">Select party</option>
                                        {parties.map((party) => (
                                            <option key={party.id} value={party.id}>
                                                {party.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.party_id} className="mt-1" />
                                </FormField>
                            </FormGrid>

                            <div className="mt-4">
                                <RouteLocationFields
                                    fromValue={data.route_from}
                                    toValue={data.route_to}
                                    onFromChange={(value) => setField('route_from', value)}
                                    onToChange={(value) => setField('route_to', value)}
                                    locationOptions={locationOptions}
                                    locationsHref={locationsHref}
                                />
                            </div>

                            <FormGrid cols={2} className="mt-4">
                                <FormField>
                                    <InputLabel value="Authorised signatory" />
                                    <TextInput
                                        className={inputClass('authorized_signatory')}
                                        value={data.authorized_signatory}
                                        onChange={(e) => setField('authorized_signatory', e.target.value)}
                                        placeholder="e.g. PRATIK PATEL"
                                    />
                                </FormField>
                            </FormGrid>
                        </FormCard>

                        <FormCard>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <FormSectionHeader
                                    title="Vehicle lines"
                                    description="Each row becomes a line on the loading slip and tax invoice."
                                />
                                <SecondaryButton type="button" onClick={addLine} className="w-full sm:w-auto">
                                    + Add vehicle
                                </SecondaryButton>
                            </div>

                            {errors.lines && (
                                <p className="mt-2 text-sm text-red-600">{errors.lines}</p>
                            )}

                            <div className="mt-4 space-y-4">
                                {data.lines.map((line, index) => (
                                    <div
                                        key={index}
                                        className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 sm:p-4"
                                    >
                                        <div className="mb-4 flex items-center justify-between gap-2">
                                            <span className="text-sm font-medium text-gray-800">
                                                Line {index + 1}
                                            </span>
                                            {data.lines.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeLine(index)}
                                                    className="text-sm text-red-600 hover:underline"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>

                                        <FormGrid cols={3}>
                                            <FormField>
                                                <InputLabel value="Vehicle" />
                                                <MasterDataSelect
                                                    value={line.vehicle_number}
                                                    options={vehicleOptions}
                                                    emptyLabel="Select vehicle"
                                                    addLabel="+ Add vehicle"
                                                    addHref={vehiclesHref}
                                                    onChange={(value) => selectVehicle(index, value)}
                                                />
                                                <InputError
                                                    message={errors[`lines.${index}.vehicle_id`]}
                                                    className="mt-1"
                                                />
                                            </FormField>
                                            <FormField>
                                                <InputLabel value="Destination" />
                                                <MasterDataSelect
                                                    value={line.destination}
                                                    options={locationOptions}
                                                    emptyLabel="Select destination"
                                                    addLabel="+ Add location"
                                                    addHref={locationsHref}
                                                    onChange={(value) => updateLine(index, 'destination', value)}
                                                />
                                            </FormField>
                                            <FormField>
                                                <InputLabel value="Freight rate" />
                                                <TextInput
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className={inputClass(`lines.${index}.freight_rate`)}
                                                    value={line.freight_rate}
                                                    onChange={(e) =>
                                                        updateLine(index, 'freight_rate', e.target.value)
                                                    }
                                                />
                                                <InputError
                                                    message={errors[`lines.${index}.freight_rate`]}
                                                    className="mt-1"
                                                />
                                            </FormField>
                                            <FormField>
                                                <InputLabel value="Advance" />
                                                <TextInput
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className={formControlClass}
                                                    value={line.advance}
                                                    onChange={(e) => updateLine(index, 'advance', e.target.value)}
                                                />
                                            </FormField>
                                            <FormField>
                                                <InputLabel value="Balance" />
                                                <TextInput
                                                    readOnly
                                                    className={`${formControlClass} bg-gray-100`}
                                                    value={formatMoney(lineBalance(line.freight_rate, line.advance))}
                                                />
                                            </FormField>
                                        </FormGrid>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div className="rounded-lg bg-emerald-50 p-3">
                                    <p className="text-xs text-emerald-700">Total freight</p>
                                    <p className="text-lg font-semibold text-emerald-900">
                                        {formatMoney(totals.total_freight)}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-yellow-50 p-3">
                                    <p className="text-xs text-yellow-700">Total advance</p>
                                    <p className="text-lg font-semibold text-yellow-900">
                                        {formatMoney(totals.total_advance)}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-gray-50 p-3">
                                    <p className="text-xs text-gray-600">Total balance</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {formatMoney(totals.total_balance)}
                                    </p>
                                </div>
                            </div>
                        </FormCard>

                        <FormActions>
                            <Link href={route('loading-slips.index')}>
                                <SecondaryButton type="button">Cancel</SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Saving…' : isEdit ? 'Update slip' : 'Save slip'}
                            </PrimaryButton>
                        </FormActions>
                    </form>
                )}
            </FormPage>
        </>
    );
}
