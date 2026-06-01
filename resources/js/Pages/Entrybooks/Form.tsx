import PageContainer from '@/Components/PageContainer';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import MasterDataSelect from '@/Components/MasterDataSelect';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { usePageHeader } from '@/hooks/usePageHeader';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { apiFieldErrors, fieldInputClass, hasApiFieldErrors } from '@/lib/apiFormErrors';
import {
    validateEntrybookForm,
    type EntrybookFormData,
} from '@/lib/entrybookValidation';
import { calculateEntrybookBalance, formatMoney } from '@/lib/freightCalculator';
import { masterListHref } from '@/lib/invoiceReturn';
import type { Entrybook, Party, RouteLocation, Vehicle } from '@/types/transport';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

function dateInputValue(value?: string | null): string {
    return value?.slice(0, 10) ?? '';
}

type EntrybookShowData = {
    entrybook: Entrybook;
    vehicles: Pick<Vehicle, 'id' | 'vehicle_number'>[];
    routes: Pick<RouteLocation, 'id' | 'name'>[];
    parties: Pick<Party, 'id' | 'name'>[];
};

type EntrybookMetaData = {
    vehicles: Pick<Vehicle, 'id' | 'vehicle_number'>[];
    routes: Pick<RouteLocation, 'id' | 'name'>[];
    parties: Pick<Party, 'id' | 'name'>[];
    nextEntryNumber: string;
};

export default function EntrybookForm({ entrybookId }: { entrybookId?: number }) {
    const isEdit = Boolean(entrybookId);

    usePageHeader(
        <h2 className="text-xl font-semibold text-gray-800">
            {isEdit ? 'Edit Entry' : 'Add Entry'}
        </h2>,
    );

    const [vehicles, setVehicles] = useState<Pick<Vehicle, 'id' | 'vehicle_number'>[]>([]);
    const [routes, setRoutes] = useState<Pick<RouteLocation, 'id' | 'name'>[]>([]);
    const [parties, setParties] = useState<Pick<Party, 'id' | 'name'>[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof EntrybookFormData, string>>>({});
    const [entryNumber, setEntryNumber] = useState('');
    const [data, setData] = useState<EntrybookFormData>({
        entry_date: new Date().toISOString().slice(0, 10),
        vehicle_id: '',
        party_id: '',
        route_from: '',
        freight: '',
        advance: '0',
    });

    useEffect(() => {
        setLoading(true);
        setLoadError(null);

        const load = async () => {
            try {
                if (entrybookId) {
                    const res = await appApiPost<ApiEnvelope<EntrybookShowData>>(
                        '/entrybooks/entrybook-show',
                        { id: entrybookId },
                    );

                    if (!res.success || !res.data?.entrybook) {
                        setLoadError(res.message || 'Could not load entry.');
                        return;
                    }

                    const entry = res.data.entrybook;
                    setVehicles(res.data.vehicles);
                    setRoutes(res.data.routes);
                    setParties(res.data.parties);
                    setEntryNumber(entry.entry_number);
                    setData({
                        entry_date: dateInputValue(entry.entry_date),
                        vehicle_id: entry.vehicle_id ? String(entry.vehicle_id) : '',
                        party_id: entry.party_id ? String(entry.party_id) : '',
                        route_from: entry.route_from ?? '',
                        freight: entry.freight != null ? String(entry.freight) : '',
                        advance: entry.advance != null ? String(entry.advance) : '0',
                    });
                } else {
                    const res = await appApiPost<ApiEnvelope<EntrybookMetaData>>(
                        '/entrybooks/entrybook-meta',
                        {},
                    );

                    if (!res.success || !res.data) {
                        setLoadError(res.message || 'Could not load form data.');
                        return;
                    }

                    setVehicles(res.data.vehicles);
                    setRoutes(res.data.routes);
                    setParties(res.data.parties);
                    setEntryNumber(res.data.nextEntryNumber);
                }
            } catch {
                setLoadError('Could not load form data.');
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [entrybookId]);

    const balance = useMemo(
        () => calculateEntrybookBalance(data.freight, data.advance),
        [data.freight, data.advance],
    );

    const routeOptions = useMemo(
        () => routes.map((r) => ({ value: r.name, label: r.name })),
        [routes],
    );

    const routesHref = masterListHref('routes.index', isEdit, entrybookId, 'entrybook');

    const setField = (field: keyof EntrybookFormData, value: string) => {
        setData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoadError(null);

        const clientErrors = validateEntrybookForm(data);
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            return;
        }

        setProcessing(true);

        try {
            const payload = {
                ...data,
                vehicle_id: Number(data.vehicle_id),
                party_id: Number(data.party_id),
                freight: Number(data.freight),
                advance: Number(data.advance),
                route_from: data.route_from || null,
                ...(entrybookId ? { id: entrybookId } : {}),
            };

            const res = await appApiPost<ApiEnvelope<{ entrybook: Entrybook }>>(
                entrybookId ? '/entrybooks/entrybook-update' : '/entrybooks/entrybook-store',
                payload,
            );

            if (!res.success) {
                setErrors(apiFieldErrors(res.data));
                if (!hasApiFieldErrors(res.data)) {
                    setLoadError(res.message || 'Could not save entry.');
                }
                return;
            }

            router.visit(route('entrybooks.index'));
        } catch {
            setLoadError('Could not save entry.');
        } finally {
            setProcessing(false);
        }
    };

    const inputClass = (field: keyof EntrybookFormData) =>
        fieldInputClass(
            Boolean(errors[field]),
            'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500',
        );

    if (loading) {
        return (
            <>
                <Head title={isEdit ? 'Edit Entry' : 'Add Entry'} />
                <p className="py-8 text-center text-sm text-gray-500">Loading…</p>
            </>
        );
    }

    return (
        <>
            <Head title={isEdit ? 'Edit Entry' : 'Add Entry'} />

            <PageContainer width="2xl">
                    {loadError && (
                        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {loadError}
                        </p>
                    )}

                    <form onSubmit={submit} className="space-y-5 rounded-lg bg-white p-6 shadow">
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <InputLabel value="Entry No." />
                                <TextInput
                                    readOnly
                                    disabled
                                    className="mt-1 block w-full cursor-not-allowed rounded-md border-gray-200 bg-gray-50 text-gray-700 shadow-sm"
                                    value={entryNumber}
                                />
                                {!isEdit && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Assigned automatically on save (001, 002, …).
                                    </p>
                                )}
                            </div>

                            <div>
                                <InputLabel value="Date" />
                                <TextInput
                                    type="date"
                                    className={inputClass('entry_date')}
                                    value={data.entry_date}
                                    onChange={(e) => setField('entry_date', e.target.value)}
                                />
                                <InputError message={errors.entry_date} className="mt-1" />
                            </div>
                        </div>

                        <div>
                            <InputLabel value="Vehicle" />
                            <select
                                className={inputClass('vehicle_id')}
                                value={data.vehicle_id}
                                onChange={(e) => setField('vehicle_id', e.target.value)}
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
                            <InputLabel value="Party" />
                            <select
                                className={inputClass('party_id')}
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
                        </div>

                        <div>
                            <InputLabel value="From (Route)" />
                            <MasterDataSelect
                                value={data.route_from}
                                options={routeOptions}
                                emptyLabel="Select route"
                                addLabel="+ Add route"
                                addHref={routesHref}
                                onChange={(value) => setField('route_from', value)}
                            />
                            <InputError message={errors.route_from} className="mt-1" />
                        </div>

                        <div className="grid gap-5 sm:grid-cols-3">
                            <div>
                                <InputLabel value="Freight" />
                                <TextInput
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className={inputClass('freight')}
                                    value={data.freight}
                                    onChange={(e) => setField('freight', e.target.value)}
                                />
                                <InputError message={errors.freight} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Advance" />
                                <TextInput
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className={inputClass('advance')}
                                    value={data.advance}
                                    onChange={(e) => setField('advance', e.target.value)}
                                />
                                <InputError message={errors.advance} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Balance" />
                                <p className="mt-2 text-lg font-semibold text-gray-900">
                                    ₹ {formatMoney(balance)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <PrimaryButton disabled={processing}>
                                {isEdit ? 'Update Entry' : 'Save Entry'}
                            </PrimaryButton>
                            <Link
                                href={route('entrybooks.index')}
                                className="text-sm text-gray-600 hover:text-gray-900"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
            </PageContainer>
        </>
    );
}
