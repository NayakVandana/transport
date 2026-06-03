import { FormPageHeader } from '@/Components/ListPageHeader';
import FormPage, { FormActions, FormCard, FormGrid } from '@/Components/FormPage';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { apiFieldErrors, fieldInputClass, hasApiFieldErrors } from '@/lib/apiFormErrors';
import {
    validateDailyReportForm,
    type DailyReportFormData,
} from '@/lib/dailyReportValidation';
import { formatReportDayLabel } from '@/lib/dateUtils';
import { usePageHeader } from '@/hooks/usePageHeader';
import type { DailyReport, Party, RouteLocation, Vehicle } from '@/types/transport';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

function dateInputValue(value?: string | null): string {
    return value?.slice(0, 10) ?? '';
}

type DailyReportMetaData = {
    vehicles: Pick<Vehicle, 'id' | 'vehicle_number'>[];
    parties: Pick<Party, 'id' | 'name'>[];
    routes: Pick<RouteLocation, 'id' | 'name'>[];
    nextSerialNumber: number;
};

type DailyReportShowData = DailyReportMetaData & {
    dailyReport: DailyReport;
};

export default function DailyReportForm({
    dailyReportId,
    vehicleId,
    reportDate,
}: {
    dailyReportId?: number;
    vehicleId?: number | null;
    reportDate?: string | null;
}) {
    const isEdit = Boolean(dailyReportId);
    const lockedVehicle = vehicleId ?? null;

    usePageHeader(
        <FormPageHeader
            title={isEdit ? 'Edit Daily Report Row' : 'Add Daily Report Row'}
            backHref={route('daily-reports.index')}
            backLabel="Back to list"
            backMobileLabel="Back"
        />,
    );

    const [vehicles, setVehicles] = useState<Pick<Vehicle, 'id' | 'vehicle_number'>[]>([]);
    const [parties, setParties] = useState<Pick<Party, 'id' | 'name'>[]>([]);
    const [routes, setRoutes] = useState<Pick<RouteLocation, 'id' | 'name'>[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof DailyReportFormData, string>>>({});
    const [data, setData] = useState<DailyReportFormData>({
        report_date: reportDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        serial_number: '',
        vehicle_id: lockedVehicle ? String(lockedVehicle) : '',
        description: '',
        current_party_id: '',
        planning_party_id: '',
        location: '',
        detention: '0',
        day: '',
    });

    const loadMeta = async (reportDate?: string) => {
        const res = await appApiPost<ApiEnvelope<DailyReportMetaData>>(
            '/daily-reports/daily-report-meta',
            reportDate ? { report_date: reportDate } : {},
        );

        if (!res.success || !res.data) {
            throw new Error(res.message || 'Could not load form data.');
        }

        setVehicles(res.data.vehicles);
        setParties(res.data.parties);
        setRoutes(res.data.routes);

        if (!isEdit) {
            setData((prev) => ({
                ...prev,
                serial_number: String(res.data!.nextSerialNumber),
            }));
        }

        return res.data;
    };

    useEffect(() => {
        setLoading(true);
        setLoadError(null);

        const load = async () => {
            try {
                if (dailyReportId) {
                    const res = await appApiPost<ApiEnvelope<DailyReportShowData>>(
                        '/daily-reports/daily-report-show',
                        { id: dailyReportId },
                    );

                    if (!res.success || !res.data?.dailyReport) {
                        setLoadError(res.message || 'Could not load daily report row.');
                        return;
                    }

                    const row = res.data.dailyReport;
                    setVehicles(res.data.vehicles);
                    setParties(res.data.parties);
                    setRoutes(res.data.routes);
                    setData({
                        report_date: dateInputValue(row.report_date),
                        serial_number: String(row.serial_number),
                        vehicle_id: String(row.vehicle_id),
                        description: row.description ?? '',
                        current_party_id: row.current_party_id ? String(row.current_party_id) : '',
                        planning_party_id: row.planning_party_id
                            ? String(row.planning_party_id)
                            : '',
                        location: row.location ?? '',
                        detention: String(row.detention ?? 0),
                        day: row.day != null ? String(row.day) : '',
                    });
                } else {
                    await loadMeta(reportDate?.slice(0, 10) ?? data.report_date);
                }
            } catch {
                setLoadError('Could not load form data.');
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [dailyReportId, isEdit, lockedVehicle, reportDate]);

    const dayPreview = useMemo(
        () => formatReportDayLabel(data.report_date, data.day.trim() ? Number(data.day) : null),
        [data.report_date, data.day],
    );

    const setField = (field: keyof DailyReportFormData, value: string) => {
        setData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const onDateChange = async (value: string) => {
        setField('report_date', value);

        if (!isEdit && value) {
            try {
                await loadMeta(value);
            } catch {
                setLoadError('Could not load serial number for this date.');
            }
        }
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoadError(null);

        const clientErrors = validateDailyReportForm(data);
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            return;
        }

        setProcessing(true);

        try {
            const payload = {
                report_date: data.report_date,
                serial_number: data.serial_number ? Number(data.serial_number) : undefined,
                vehicle_id: Number(data.vehicle_id),
                description: data.description || null,
                current_party_id: data.current_party_id ? Number(data.current_party_id) : null,
                planning_party_id: data.planning_party_id ? Number(data.planning_party_id) : null,
                location: data.location || null,
                detention: Number(data.detention || 0),
                day: data.day.trim() ? Number(data.day) : null,
                ...(dailyReportId ? { id: dailyReportId } : {}),
            };

            const res = await appApiPost<ApiEnvelope<{ dailyReport: DailyReport }>>(
                dailyReportId
                    ? '/daily-reports/daily-report-update'
                    : '/daily-reports/daily-report-store',
                payload,
            );

            if (!res.success) {
                setErrors(apiFieldErrors(res.data));
                if (!hasApiFieldErrors(res.data)) {
                    setLoadError(res.message || 'Could not save daily report row.');
                }
                return;
            }

            router.visit(route('daily-reports.index'));
        } catch {
            setLoadError('Could not save daily report row.');
        } finally {
            setProcessing(false);
        }
    };

    const inputClass = (field: keyof DailyReportFormData) =>
        fieldInputClass(
            Boolean(errors[field]),
            'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500',
        );

    if (loading) {
        return (
            <>
                <Head title={isEdit ? 'Edit Daily Report Row' : 'Add Daily Report Row'} />
                <FormPage size="md">
                    <FormCard>
                        <p className="py-6 text-center text-sm text-gray-500">Loading…</p>
                    </FormCard>
                </FormPage>
            </>
        );
    }

    return (
        <>
            <Head title={isEdit ? 'Edit Daily Report Row' : 'Add Daily Report Row'} />

            <FormPage size="md">
                <FormCard>
                    {loadError && (
                        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {loadError}
                        </p>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        <FormGrid cols={3}>
                            <div>
                                <InputLabel value="Serial Number" />
                                <TextInput
                                    type="number"
                                    min="1"
                                    className={inputClass('serial_number')}
                                    value={data.serial_number}
                                    onChange={(e) => setField('serial_number', e.target.value)}
                                />
                                <InputError message={errors.serial_number} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Date" />
                                <TextInput
                                    type="date"
                                    className={inputClass('report_date')}
                                    value={data.report_date}
                                    onChange={(e) => void onDateChange(e.target.value)}
                                />
                                <InputError message={errors.report_date} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Day" />
                                <TextInput
                                    type="number"
                                    min="1"
                                    className={inputClass('day')}
                                    value={data.day}
                                    onChange={(e) => setField('day', e.target.value)}
                                    placeholder="Optional day count"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Display: {dayPreview}
                                    {!data.day.trim() ? ' (weekday from date)' : ''}
                                </p>
                                <InputError message={errors.day} className="mt-1" />
                            </div>
                        </FormGrid>

                        <FormGrid cols={2}>
                            <div>
                                <InputLabel value="Vehicle" />
                                <select
                                    className={inputClass('vehicle_id')}
                                    value={data.vehicle_id}
                                    onChange={(e) => setField('vehicle_id', e.target.value)}
                                    disabled={Boolean(lockedVehicle) && !isEdit}
                                >
                                    <option value="">Select vehicle</option>
                                    {vehicles.map((vehicle) => (
                                        <option key={vehicle.id} value={vehicle.id}>
                                            {vehicle.vehicle_number}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.vehicle_id} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Detention" />
                                <TextInput
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className={inputClass('detention')}
                                    value={data.detention}
                                    onChange={(e) => setField('detention', e.target.value)}
                                />
                                <InputError message={errors.detention} className="mt-1" />
                            </div>
                        </FormGrid>

                        <div>
                            <InputLabel value="Description" />
                            <textarea
                                className={`${inputClass('description')} min-h-[80px]`}
                                value={data.description}
                                onChange={(e) => setField('description', e.target.value)}
                            />
                            <InputError message={errors.description} className="mt-1" />
                        </div>

                        <FormGrid cols={2}>
                            <div>
                                <InputLabel value="Current Party" />
                                <select
                                    className={inputClass('current_party_id')}
                                    value={data.current_party_id}
                                    onChange={(e) => setField('current_party_id', e.target.value)}
                                >
                                    <option value="">Select party</option>
                                    {parties.map((party) => (
                                        <option key={party.id} value={party.id}>
                                            {party.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.current_party_id} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Planning Party" />
                                <select
                                    className={inputClass('planning_party_id')}
                                    value={data.planning_party_id}
                                    onChange={(e) => setField('planning_party_id', e.target.value)}
                                >
                                    <option value="">Select party</option>
                                    {parties.map((party) => (
                                        <option key={party.id} value={party.id}>
                                            {party.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.planning_party_id} className="mt-1" />
                            </div>
                        </FormGrid>

                        <div>
                            <InputLabel value="Location" />
                            <TextInput
                                list="daily-report-locations"
                                className={inputClass('location')}
                                value={data.location}
                                onChange={(e) => setField('location', e.target.value)}
                                placeholder="Route / location"
                            />
                            <datalist id="daily-report-locations">
                                {routes.map((routeRow) => (
                                    <option key={routeRow.id} value={routeRow.name} />
                                ))}
                            </datalist>
                            <InputError message={errors.location} className="mt-1" />
                        </div>

                        <FormActions>
                            <PrimaryButton disabled={processing}>
                                {isEdit ? 'Update Row' : 'Save Row'}
                            </PrimaryButton>
                            <Link href={route('daily-reports.index')}>
                                <SecondaryButton type="button">Cancel</SecondaryButton>
                            </Link>
                        </FormActions>
                    </form>
                </FormCard>
            </FormPage>
        </>
    );
}
