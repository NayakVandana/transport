import RouteLocationFields from '@/Components/RouteLocationFields';
import { FormPageHeader } from '@/Components/ListPageHeader';
import FormPage, { FormActions, FormCard, FormField, FormGrid, FormSectionHeader, formControlClass, formSelectClass } from '@/Components/FormPage';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
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
    ensureLoadingSlipLine,
    lineBalance,
    newLoadingSlipLineKey,
    normalizeLoadingSlipLines,
    slipTotals,
    validateLoadingSlipForm,
    type LoadingSlipFormData,
    type LoadingSlipLineDraft,
} from '@/lib/loadingSlipValidation';
import { todayDate } from '@/lib/quickAdd';
import type { LoadingSlip, Location, Party, Vehicle } from '@/types/transport';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

type VehicleOption = { value: string; label: string };

const ADD_VEHICLE = '__add_vehicle__';
const ADD_DESTINATION = '__add_destination__';

function lineVehicleSelectValue(lineKey: string, vehicleId: string): string {
    return vehicleId ? `${lineKey}::${vehicleId}` : '';
}

function parseLineVehicleSelectValue(raw: string): string {
    if (!raw) {
        return '';
    }
    if (raw === ADD_VEHICLE) {
        return ADD_VEHICLE;
    }
    const separator = raw.indexOf('::');
    return separator >= 0 ? raw.slice(separator + 2) : raw;
}

function lineDestinationSelectValue(lineKey: string, destination: string): string {
    return destination ? `${lineKey}::${destination}` : '';
}

function parseLineDestinationSelectValue(raw: string): string {
    if (!raw) {
        return '';
    }
    if (raw === ADD_DESTINATION) {
        return ADD_DESTINATION;
    }
    const separator = raw.indexOf('::');
    return separator >= 0 ? raw.slice(separator + 2) : raw;
}

function destinationOptionsForLine(
    routeFrom: string,
    routeTo: string,
    locationOptions: VehicleOption[],
): VehicleOption[] {
    const excluded = new Set([routeFrom.trim(), routeTo.trim()].filter(Boolean));
    return locationOptions.filter((option) => !excluded.has(option.value));
}

function vehicleOptionsForLine(
    lineKey: string,
    lines: LoadingSlipLineDraft[],
    vehicleOptions: VehicleOption[],
): VehicleOption[] {
    const usedIds = new Set(
        lines
            .filter((line) => line.key !== lineKey && line.vehicle_id.trim() !== '')
            .map((line) => line.vehicle_id.trim()),
    );
    return vehicleOptions.filter((option) => !usedIds.has(option.value));
}

function locationsMatch(a: string, b: string): boolean {
    return (
        a.trim() !== ''
        && b.trim() !== ''
        && a.trim().localeCompare(b.trim(), undefined, { sensitivity: 'accent' }) === 0
    );
}

function sanitizeLineDestination(
    destination: string,
    routeFrom: string,
    routeTo: string,
): string {
    const value = destination.trim();
    if (!value) {
        return '';
    }
    if (locationsMatch(value, routeFrom) || locationsMatch(value, routeTo)) {
        return '';
    }
    return destination;
}

type LoadingSlipVehicleSelectProps = {
    lineKey: string;
    selectedVehicleId: string;
    selectedVehicleNumber: string;
    options: VehicleOption[];
    addHref: string;
    onChange: (vehicleId: string) => void;
};

function LoadingSlipVehicleSelect({
    lineKey,
    selectedVehicleId,
    selectedVehicleNumber,
    options,
    addHref,
    onChange,
}: LoadingSlipVehicleSelectProps) {
    const vehicleId = selectedVehicleId || '';
    const lineOptions = options.map((option) => ({
        value: lineVehicleSelectValue(lineKey, option.value),
        label: option.label,
    }));
    const selectedValue = lineVehicleSelectValue(lineKey, vehicleId);
    const allOptions =
        vehicleId && !options.some((o) => o.value === vehicleId)
            ? [
                  {
                      value: lineVehicleSelectValue(lineKey, vehicleId),
                      label: selectedVehicleNumber || vehicleId,
                  },
                  ...lineOptions,
              ]
            : lineOptions;

    return (
        <select
            id={`loading-slip-vehicle-${lineKey}`}
            name={`loading-slip-vehicle-${lineKey}`}
            autoComplete={`loading-slip-vehicle-${lineKey}`}
            data-1p-ignore="true"
            data-lpignore="true"
            className={formSelectClass}
            value={selectedValue}
            onChange={(e) => {
                const next = parseLineVehicleSelectValue(e.target.value);
                if (next === ADD_VEHICLE) {
                    router.visit(addHref);
                    return;
                }
                onChange(next);
            }}
        >
            <option value="">Select vehicle</option>
            {allOptions.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
            <option value={lineVehicleSelectValue(lineKey, ADD_VEHICLE)}>+ Add vehicle</option>
        </select>
    );
}

type LoadingSlipDestinationSelectProps = {
    lineKey: string;
    selectedDestination: string;
    options: VehicleOption[];
    addHref: string;
    className: string;
    onChange: (destination: string) => void;
};

function LoadingSlipDestinationSelect({
    lineKey,
    selectedDestination,
    options,
    addHref,
    className,
    onChange,
}: LoadingSlipDestinationSelectProps) {
    const destination = selectedDestination || '';
    const lineOptions = options.map((option) => ({
        value: lineDestinationSelectValue(lineKey, option.value),
        label: option.label,
    }));
    const selectedValue = lineDestinationSelectValue(lineKey, destination);
    const allOptions =
        destination && !options.some((o) => o.value === destination)
            ? [
                  {
                      value: lineDestinationSelectValue(lineKey, destination),
                      label: destination,
                  },
                  ...lineOptions,
              ]
            : lineOptions;

    return (
        <select
            id={`loading-slip-destination-${lineKey}`}
            name={`loading-slip-destination-${lineKey}`}
            autoComplete={`loading-slip-destination-${lineKey}`}
            data-1p-ignore="true"
            data-lpignore="true"
            className={className}
            value={selectedValue}
            onChange={(e) => {
                const next = parseLineDestinationSelectValue(e.target.value);
                if (next === ADD_DESTINATION) {
                    router.visit(addHref);
                    return;
                }
                onChange(next);
            }}
        >
            <option value="">Select destination</option>
            {allOptions.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
            <option value={lineDestinationSelectValue(lineKey, ADD_DESTINATION)}>+ Add location</option>
        </select>
    );
}

type LoadingSlipLineCardProps = {
    line: LoadingSlipLineDraft;
    index: number;
    canRemove: boolean;
    routeFrom: string;
    routeTo: string;
    allLines: LoadingSlipLineDraft[];
    vehicleOptions: VehicleOption[];
    locationOptions: VehicleOption[];
    locationsHref: string;
    errors: Record<string, string>;
    inputClass: (field: string) => string;
    onRemove: (lineKey: string) => void;
    onSelectVehicle: (lineKey: string, lineIndex: number, vehicleId: string) => void;
    onUpdateLine: (lineKey: string, lineIndex: number, field: keyof LoadingSlipLineDraft, value: string) => void;
};

function LoadingSlipLineCard({
    line,
    index,
    canRemove,
    routeFrom,
    routeTo,
    allLines,
    vehicleOptions,
    locationOptions,
    locationsHref,
    errors,
    inputClass,
    onRemove,
    onSelectVehicle,
    onUpdateLine,
}: LoadingSlipLineCardProps) {
    const selectedVehicleId = line.vehicle_id ?? '';
    const selectedVehicleNumber = line.vehicle_number ?? '';
    const selectedDestination = line.destination ?? '';
    const lineVehicleOptions = vehicleOptionsForLine(line.key, allLines, vehicleOptions);
    const lineDestinationOptions = destinationOptionsForLine(routeFrom, routeTo, locationOptions);

    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 sm:p-4">
            <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium">Line {index + 1}</span>
                {canRemove && (
                    <button
                        type="button"
                        onClick={() => onRemove(line.key)}
                        className="text-sm text-red-600 hover:underline"
                    >
                        Remove
                    </button>
                )}
            </div>
            <FormGrid cols={3}>
                <FormField>
                    <InputLabel value="Vehicle" />
                    <LoadingSlipVehicleSelect
                        lineKey={line.key}
                        selectedVehicleId={selectedVehicleId}
                        selectedVehicleNumber={selectedVehicleNumber}
                        options={lineVehicleOptions}
                        addHref={route('vehicles.create')}
                        onChange={(vehicleId) => onSelectVehicle(line.key, index, vehicleId)}
                    />
                    <InputError message={errors[`lines.${index}.vehicle_id`]} className="mt-1" />
                </FormField>
                <FormField>
                    <InputLabel value="Destination" />
                    <LoadingSlipDestinationSelect
                        lineKey={line.key}
                        selectedDestination={selectedDestination}
                        options={lineDestinationOptions}
                        addHref={locationsHref}
                        className={fieldInputClass(Boolean(errors[`lines.${index}.destination`]), formSelectClass)}
                        onChange={(value) => onUpdateLine(line.key, index, 'destination', value)}
                    />
                    <InputError message={errors[`lines.${index}.destination`]} className="mt-1" />
                </FormField>
                <FormField>
                    <InputLabel value="Freight rate" />
                    <TextInput
                        type="number"
                        min="0"
                        step="0.01"
                        className={inputClass(`lines.${index}.freight_rate`)}
                        value={line.freight_rate}
                        onChange={(e) => onUpdateLine(line.key, index, 'freight_rate', e.target.value)}
                    />
                    <InputError message={errors[`lines.${index}.freight_rate`]} className="mt-1" />
                </FormField>
                <FormField>
                    <InputLabel value="Advance" />
                    <TextInput
                        type="number"
                        min="0"
                        step="0.01"
                        className={formControlClass}
                        value={line.advance}
                        onChange={(e) => onUpdateLine(line.key, index, 'advance', e.target.value)}
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
    );
}

function slipToFormData(slip: LoadingSlip): LoadingSlipFormData {
    return {
        slip_date: slip.slip_date.slice(0, 10),
        loading_date: slip.loading_date?.slice(0, 10) ?? '',
        party_id: slip.party_id ? String(slip.party_id) : '',
        route_from: slip.route_from ?? '',
        route_to: slip.route_to ?? '',
        authorized_signatory: slip.authorized_signatory ?? '',
        lines: slip.lines?.length
            ? slip.lines.map((line) =>
                  ensureLoadingSlipLine({
                      key: line.id != null ? `db-${line.id}` : newLoadingSlipLineKey(),
                      vehicle_id: line.vehicle_id ? String(line.vehicle_id) : '',
                      vehicle_number: line.vehicle_number ?? line.vehicle?.vehicle_number ?? '',
                      destination: line.destination ?? '',
                      freight_rate: line.freight_rate != null ? String(line.freight_rate) : '',
                      advance: line.advance != null ? String(line.advance) : '0',
                  }),
              )
            : [emptyLoadingSlipLine()],
    };
}

export default function LoadingSlipForm({ loadingSlipId }: { loadingSlipId?: number }) {
    const isEdit = Boolean(loadingSlipId);
    usePageHeader(<FormPageHeader title={isEdit ? 'Edit Loading Slip' : 'New Loading Slip'} backHref={route('loading-slips.index')} />);

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
                    const res = await appApiPost<ApiEnvelope<{ loadingSlip: LoadingSlip }>>('/loading-slips/loading-slip-show', { id: loadingSlipId });
                    if (!res.success || !res.data?.loadingSlip) { setLoadError(res.message || 'Could not load loading slip.'); return; }
                    if (res.data.loadingSlip.freight_invoice_id) { setLoadError('This loading slip is already invoiced and cannot be edited.'); return; }
                    const metaRes = await appApiPost<ApiEnvelope<{ parties: typeof parties; vehicles: typeof vehicles; routes: typeof locations }>>('/loading-slips/loading-slip-meta', {});
                    if (metaRes.success && metaRes.data) { setParties(metaRes.data.parties); setVehicles(metaRes.data.vehicles); setLocations(metaRes.data.routes); }
                    setData(slipToFormData(res.data.loadingSlip));
                } else {
                    const res = await appApiPost<ApiEnvelope<{ parties: typeof parties; vehicles: typeof vehicles; routes: typeof locations }>>('/loading-slips/loading-slip-meta', {});
                    if (!res.success || !res.data) { setLoadError(res.message || 'Could not load form data.'); return; }
                    setParties(res.data.parties); setVehicles(res.data.vehicles); setLocations(res.data.routes);
                }
            } catch { setLoadError('Could not load form data.'); } finally { setLoading(false); }
        };
        void load();
    }, [loadingSlipId]);

    useEffect(() => {
        setData((prev) => {
            if (prev.lines.every((line) => line.key?.trim())) {
                return prev;
            }
            return { ...prev, lines: normalizeLoadingSlipLines(prev.lines) };
        });
    }, []);

    const totals = useMemo(() => slipTotals(data.lines), [data.lines]);
    const locationOptions = useMemo(() => locations.map((l) => ({ value: l.name, label: l.name })), [locations]);
    const vehicleOptions = useMemo(
        () => vehicles.map((v) => ({ value: String(v.id), label: v.vehicle_number })),
        [vehicles],
    );
    const locationsHref = masterListHref('locations.index', isEdit, loadingSlipId, 'invoice');
    const inputClass = (field: string) => fieldInputClass(Boolean(errors[field]), formControlClass);

    const setField = <K extends keyof LoadingSlipFormData>(field: K, value: LoadingSlipFormData[K]) => {
        setData((prev) => {
            if (field === 'route_from' || field === 'route_to') {
                const routeFrom = field === 'route_from' ? String(value) : prev.route_from;
                const routeTo = field === 'route_to' ? String(value) : prev.route_to;
                return {
                    ...prev,
                    [field]: value,
                    lines: prev.lines.map((line) => ({
                        ...line,
                        destination: sanitizeLineDestination(line.destination, routeFrom, routeTo),
                    })),
                };
            }
            return { ...prev, [field]: value };
        });
        setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    };

    const updateLine = (
        lineKey: string,
        lineIndex: number,
        field: keyof LoadingSlipLineDraft,
        value: string,
    ) => {
        if (field === 'key') return;
        setData((prev) => ({
            ...prev,
            lines: prev.lines.map((line) => (line.key === lineKey ? { ...line, [field]: value } : line)),
        }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[`lines.${lineIndex}.${field}`];
            return next;
        });
    };

    const selectVehicle = (lineKey: string, lineIndex: number, vehicleId: string) => {
        const vehicle = vehicleId ? vehicles.find((v) => String(v.id) === vehicleId) : undefined;
        setData((prev) => ({
            ...prev,
            lines: prev.lines.map((line) => {
                if (line.key !== lineKey) {
                    return line;
                }
                return {
                    ...line,
                    vehicle_id: vehicleId,
                    vehicle_number: vehicle?.vehicle_number ?? '',
                };
            }),
        }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[`lines.${lineIndex}.vehicle_id`];
            return next;
        });
    };

    const removeLine = (lineKey: string) => {
        setData((prev) => ({
            ...prev,
            lines: normalizeLoadingSlipLines(prev.lines.filter((line) => line.key !== lineKey)),
        }));
    };

    const addLine = () => {
        setData((prev) => ({
            ...prev,
            lines: [...prev.lines.map((line) => ({ ...line })), emptyLoadingSlipLine()],
        }));
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoadError(null);
        const clientErrors = validateLoadingSlipForm(data);
        if (Object.keys(clientErrors).length > 0) { setErrors(clientErrors); return; }
        setProcessing(true);
        try {
            const payload = {
                slip_date: data.slip_date, loading_date: data.loading_date || null, party_id: Number(data.party_id),
                route_from: data.route_from.trim(), route_to: data.route_to.trim(),
                authorized_signatory: data.authorized_signatory.trim() || null,
                lines: data.lines.map((line) => ({
                    vehicle_id: line.vehicle_id ? Number(line.vehicle_id) : null,
                    vehicle_number: line.vehicle_number.trim(), destination: line.destination.trim(),
                    freight_rate: Number(line.freight_rate), advance: Number(line.advance || 0),
                })),
                ...(loadingSlipId ? { id: loadingSlipId } : {}),
            };
            const res = await appApiPost<ApiEnvelope<{ loadingSlip: LoadingSlip }>>(
                loadingSlipId ? '/loading-slips/loading-slip-update' : '/loading-slips/loading-slip-store', payload,
            );
            if (!res.success) {
                setErrors(apiFieldErrors(res.data));
                if (!hasApiFieldErrors(res.data)) {
                    const detail = typeof res.data === 'string' ? res.data : res.message;
                    setLoadError(detail || 'Could not save loading slip.');
                }
                return;
            }
            router.visit(route('loading-slips.show', res.data?.loadingSlip.id ?? loadingSlipId));
        } catch { setLoadError('Could not save loading slip.'); } finally { setProcessing(false); }
    };

    if (loading) return (<><Head title={isEdit ? 'Edit Loading Slip' : 'New Loading Slip'} /><p className="py-8 text-center text-sm text-gray-500">Loading…</p></>);

    return (
        <>
            <Head title={isEdit ? 'Edit Loading Slip' : 'New Loading Slip'} />
            <FormPage size="lg">
                {loadError ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p> : (
                    <form onSubmit={submit} className="space-y-5">
                        <FormCard>
                            <FormSectionHeader title="Slip details" description="Header information shown on the loading slip printout." />
                            <FormGrid cols={3}>
                                <FormField><InputLabel value="Slip date" /><TextInput type="date" className={inputClass('slip_date')} value={data.slip_date} onChange={(e) => setField('slip_date', e.target.value)} /><InputError message={errors.slip_date} className="mt-1" /></FormField>
                                <FormField><InputLabel value="Loading date" /><TextInput type="date" className={inputClass('loading_date')} value={data.loading_date} onChange={(e) => setField('loading_date', e.target.value)} /></FormField>
                                <FormField>
                                    <InputLabel value="Party (M/S)" />
                                    <select className={fieldInputClass(Boolean(errors.party_id), formSelectClass)} value={data.party_id} onChange={(e) => setField('party_id', e.target.value)}>
                                        <option value="">Select party</option>
                                        {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <InputError message={errors.party_id} className="mt-1" />
                                </FormField>
                            </FormGrid>
                            <div className="mt-4">
                                <RouteLocationFields
                                    fromValue={data.route_from}
                                    toValue={data.route_to}
                                    onFromChange={(v) => setField('route_from', v)}
                                    onToChange={(v) => setField('route_to', v)}
                                    locationOptions={locationOptions}
                                    locationsHref={locationsHref}
                                    errors={{ route_from: errors.route_from, route_to: errors.route_to }}
                                />
                            </div>
                            <FormGrid cols={2} className="mt-4">
                                <FormField><InputLabel value="Authorised signatory" /><TextInput className={inputClass('authorized_signatory')} value={data.authorized_signatory} onChange={(e) => setField('authorized_signatory', e.target.value)} placeholder="e.g. PRATIK PATEL" /></FormField>
                            </FormGrid>
                        </FormCard>

                        <FormCard>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <FormSectionHeader title="Vehicle lines" description="Each row becomes a line on the loading slip and tax invoice." />
                                <SecondaryButton type="button" onClick={addLine} className="w-full sm:w-auto">+ Add vehicle</SecondaryButton>
                            </div>
                            {errors.lines && <p className="mt-2 text-sm text-red-600">{errors.lines}</p>}
                            <div className="mt-4 space-y-4">
                                {data.lines.map((line, index) => (
                                    <LoadingSlipLineCard
                                        key={line.key}
                                        line={line}
                                        index={index}
                                        canRemove={data.lines.length > 1}
                                        routeFrom={data.route_from}
                                        routeTo={data.route_to}
                                        allLines={data.lines}
                                        vehicleOptions={vehicleOptions}
                                        locationOptions={locationOptions}
                                        locationsHref={locationsHref}
                                        errors={errors}
                                        inputClass={inputClass}
                                        onRemove={removeLine}
                                        onSelectVehicle={selectVehicle}
                                        onUpdateLine={updateLine}
                                    />
                                ))}
                            </div>
                            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div className="rounded-lg bg-emerald-50 p-3"><p className="text-xs text-emerald-700">Total freight</p><p className="text-lg font-semibold text-emerald-900">{formatMoney(totals.total_freight)}</p></div>
                                <div className="rounded-lg bg-yellow-50 p-3"><p className="text-xs text-yellow-700">Total advance</p><p className="text-lg font-semibold text-yellow-900">{formatMoney(totals.total_advance)}</p></div>
                                <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gray-600">Total balance</p><p className="text-lg font-semibold text-gray-900">{formatMoney(totals.total_balance)}</p></div>
                            </div>
                        </FormCard>
                        <FormActions>
                            <Link href={route('loading-slips.index')}><SecondaryButton type="button">Cancel</SecondaryButton></Link>
                            <PrimaryButton disabled={processing}>{processing ? 'Saving…' : isEdit ? 'Update slip' : 'Save slip'}</PrimaryButton>
                        </FormActions>
                    </form>
                )}
            </FormPage>
        </>
    );
}
