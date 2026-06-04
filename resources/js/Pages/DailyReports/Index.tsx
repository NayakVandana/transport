import PageContainer from '@/Components/PageContainer';
import InputError from '@/Components/InputError';
import ListExportButtons from '@/Components/ListExportButtons';
import ListFilterBar from '@/Components/ListFilterBar';
import ListingTableShell from '@/Components/ListingTableShell';
import MasterDataSelect from '@/Components/MasterDataSelect';
import ListPageHeader from '@/Components/ListPageHeader';
import PartyLink from '@/Components/PartyLink';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { formatAppDateTime, formatDateString, formatReportDayLabel } from '@/lib/dateUtils';
import { defaultDateFilters, useFilteredList } from '@/hooks/useFilteredList';
import { usePageHeader } from '@/hooks/usePageHeader';
import { apiFieldErrors, fieldInputClass } from '@/lib/apiFormErrors';
import {
    validateDailyReportDraftRow,
    type DailyReportDraftRow,
} from '@/lib/dailyReportValidation';
import { exportFilteredList } from '@/lib/listExport';
import { buildListFilterParams, type ListFilters } from '@/lib/listFilters';
import { formatMoney } from '@/lib/freightCalculator';
import type { DailyReport, DailyReportTotals, Party, RouteLocation, Vehicle } from '@/types/transport';
import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

type DailyReportFilters = ListFilters & {
    vehicle_id?: string;
    party_id?: string;
};

type DailyReportsListData = {
    dailyReports: { data: DailyReport[] };
    vehicles: Pick<Vehicle, 'id' | 'vehicle_number'>[];
    parties: Pick<Party, 'id' | 'name'>[];
    routes?: Pick<RouteLocation, 'id' | 'name'>[];
    vehicleWise?: boolean;
    filters: DailyReportFilters;
    totals: DailyReportTotals;
    filterSummary: string;
};

type DraftRow = DailyReportDraftRow & {
    id: number | null;
    vehicle_number: string;
};

type RowFieldErrors = Partial<Record<keyof DailyReportDraftRow, string>>;

const today = formatDateString(new Date());

const defaultFilters: DailyReportFilters = {
    search: '',
    vehicle_id: '',
    party_id: '',
    date_range: 'custom',
    date_from: today,
    date_to: today,
};

const cellInputBase =
    'block w-full min-w-0 rounded-md border-gray-300 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

const cellTextareaBase =
    'block w-full min-w-0 rounded-md border-gray-300 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 min-h-[4.5rem] resize-y';

function cellInputClass(hasError: boolean): string {
    return fieldInputClass(hasError, cellInputBase);
}

function cellTextareaClass(hasError: boolean): string {
    return fieldInputClass(hasError, cellTextareaBase);
}

function TotalCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg bg-white p-3 shadow">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
        </div>
    );
}

function toDraftRow(row: DailyReport): DraftRow {
    return {
        id: row.id,
        serial_number: row.serial_number,
        vehicle_id: row.vehicle_id,
        vehicle_number: row.vehicle?.vehicle_number ?? '',
        report_date: row.report_date.slice(0, 10),
        description: row.description ?? '',
        current_party_id: row.current_party_id ? String(row.current_party_id) : '',
        planning_party_id: row.planning_party_id ? String(row.planning_party_id) : '',
        location: row.location ?? '',
        detention: String(row.detention ?? 0),
        day: row.day != null ? String(row.day) : '',
    };
}

function rowSnapshot(row: DraftRow): string {
    return JSON.stringify(row);
}

function rowKey(row: DraftRow, index: number): string {
    return row.id != null ? `report-${row.id}` : `vehicle-${row.vehicle_id}-${index}`;
}

function partyName(parties: Pick<Party, 'id' | 'name'>[], partyId: string): string {
    if (!partyId) {
        return '—';
    }

    return parties.find((party) => String(party.id) === partyId)?.name ?? '—';
}

function displayText(value: string | null | undefined): string {
    const trimmed = value?.trim();
    return trimmed ? trimmed : '—';
}

function rowPayload(row: DraftRow, serialNumber: number) {
    return {
        report_date: row.report_date,
        serial_number: serialNumber,
        vehicle_id: row.vehicle_id,
        description: row.description.trim() || null,
        current_party_id: row.current_party_id ? Number(row.current_party_id) : null,
        planning_party_id: row.planning_party_id ? Number(row.planning_party_id) : null,
        location: row.location.trim() || null,
        detention: Number(row.detention || 0),
        day: row.day.trim() ? Number(row.day) : null,
    };
}

export default function DailyReportsIndex() {
    const [actionError, setActionError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const [draftRows, setDraftRows] = useState<DraftRow[]>([]);
    const [savedSnapshots, setSavedSnapshots] = useState<string[]>([]);
    const [rowErrors, setRowErrors] = useState<Record<number, RowFieldErrors>>({});
    const [savingRowIndex, setSavingRowIndex] = useState<number | null>(null);
    const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);

    const {
        data,
        filters,
        filterSummary,
        dateValue,
        loading,
        error,
        hasActiveFilters,
        applyDateChange,
        applySearch,
        updateField,
        clearFilters,
        fetchList,
    } = useFilteredList<DailyReportsListData, DailyReportFilters>({
        defaultFilters,
        extraFilterKeys: ['vehicle_id', 'party_id'],
        load: async (activeFilters) => {
            const res = await appApiPost<ApiEnvelope<DailyReportsListData>>(
                '/daily-reports/daily-reports-list',
                buildListFilterParams(activeFilters),
            );

            return {
                success: res.success,
                data: res.data,
                message: res.message,
                filters: res.data?.filters,
                filterSummary: res.data?.filterSummary,
            };
        },
    });

    const isSheetMode = Boolean(data?.vehicleWise);
    const parties = data?.parties ?? [];
    const routes = data?.routes ?? [];
    const routeOptions = useMemo(
        () => routes.map((routeRow) => ({ value: routeRow.name, label: routeRow.name })),
        [routes],
    );
    const routesHref = route('locations.create');
    const totals = data?.totals ?? { count: 0, detention: 0 };

    const editingRowDirty = useMemo(() => {
        if (editingRowIndex === null) {
            return false;
        }

        const row = draftRows[editingRowIndex];
        if (!row) {
            return false;
        }

        return rowSnapshot(row) !== (savedSnapshots[editingRowIndex] ?? '');
    }, [draftRows, savedSnapshots, editingRowIndex]);

    useEffect(() => {
        const rows = data?.dailyReports.data ?? [];
        const draft = rows.map(toDraftRow);
        setDraftRows(draft);
        setSavedSnapshots(draft.map(rowSnapshot));
        setRowErrors({});
        setEditingRowIndex(null);
    }, [data?.dailyReports.data]);

    const updateDraftRow = useCallback(
        (index: number, field: keyof DailyReportDraftRow, value: string | number) => {
            setDraftRows((prev) =>
                prev.map((row, rowIndex) =>
                    rowIndex === index ? { ...row, [field]: value } : row,
                ),
            );
            setRowErrors((prev) => {
                if (!prev[index]?.[field]) {
                    return prev;
                }

                const next = { ...prev };
                const row = { ...next[index] };
                delete row[field];

                if (Object.keys(row).length === 0) {
                    delete next[index];
                } else {
                    next[index] = row;
                }

                return next;
            });
        },
        [],
    );

    const isRowEditing = (index: number) => editingRowIndex === index;

    const revertRow = (index: number) => {
        const saved = savedSnapshots[index];
        if (!saved) {
            return;
        }

        setDraftRows((prev) =>
            prev.map((row, rowIndex) =>
                rowIndex === index ? (JSON.parse(saved) as DraftRow) : row,
            ),
        );
        setRowErrors((prev) => {
            const next = { ...prev };
            delete next[index];
            return next;
        });
    };

    const handleCancelEditRow = (index: number) => {
        revertRow(index);
        setEditingRowIndex(null);
        setActionError(null);
    };

    const handleStartEditRow = (index: number) => {
        setActionError(null);

        if (editingRowIndex !== null && editingRowIndex !== index) {
            const dirty =
                rowSnapshot(draftRows[editingRowIndex]) !==
                (savedSnapshots[editingRowIndex] ?? '');

            if (dirty && !window.confirm('Discard unsaved changes on the current row?')) {
                return;
            }

            revertRow(editingRowIndex);
        }

        setEditingRowIndex(index);
    };

    const confirmLeaveDirtyRows = () => {
        if (!editingRowDirty) {
            return true;
        }

        return window.confirm('You have unsaved row changes. Continue anyway?');
    };

    const handleSaveRow = async (index: number) => {
        const row = draftRows[index];
        if (!row) {
            return;
        }

        setActionError(null);

        const fieldErrors = validateDailyReportDraftRow(row);
        if (Object.keys(fieldErrors).length > 0) {
            setRowErrors((prev) => ({ ...prev, [index]: fieldErrors }));
            return;
        }

        setSavingRowIndex(index);

        try {
            const payload = rowPayload(row, index + 1);
            const endpoint = row.id
                ? '/daily-reports/daily-report-update'
                : '/daily-reports/daily-report-store';
            const body = row.id ? { id: row.id, ...payload } : payload;

            const res = await appApiPost<ApiEnvelope<{ dailyReport: DailyReport }>>(endpoint, body);

            if (!res.success || !res.data?.dailyReport) {
                setRowErrors((prev) => ({
                    ...prev,
                    [index]: apiFieldErrors(res.data) as RowFieldErrors,
                }));
                if (Object.keys(apiFieldErrors(res.data)).length === 0) {
                    setActionError(res.message || 'Could not save row.');
                }
                return;
            }

            const updated = toDraftRow(res.data.dailyReport);
            setDraftRows((prev) => prev.map((current, rowIndex) => (rowIndex === index ? updated : current)));
            setSavedSnapshots((prev) =>
                prev.map((snapshot, rowIndex) =>
                    rowIndex === index ? rowSnapshot(updated) : snapshot,
                ),
            );
            setRowErrors((prev) => {
                const next = { ...prev };
                delete next[index];
                return next;
            });
            setEditingRowIndex(null);

            await fetchList();
        } catch {
            setActionError('Could not save row.');
        } finally {
            setSavingRowIndex(null);
        }
    };

    const guardedDateChange = (value: Parameters<typeof applyDateChange>[0]) => {
        if (!confirmLeaveDirtyRows()) {
            return;
        }

        applyDateChange(value);
    };

    const guardedUpdateField = (field: 'vehicle_id' | 'party_id', value: string) => {
        if (!confirmLeaveDirtyRows()) {
            return;
        }

        updateField(field, value);
    };

    usePageHeader(<ListPageHeader title="Daily Report" />);

    const displayError = actionError ?? error;

    const exportFiltered = async (type: 'csv' | 'pdf') => {
        try {
            setActionError(null);
            await exportFilteredList('daily-reports', type, { ...filters, search: searchInput });
        } catch {
            setActionError(`Could not export ${type.toUpperCase()}.`);
        }
    };

    const renderCellInput = (
        index: number,
        field: keyof DailyReportDraftRow,
        element: ReactNode,
    ) => {
        const message = rowErrors[index]?.[field];

        return (
            <div className="min-w-[5rem]">
                {element}
                {message ? <InputError message={message} className="mt-0.5 text-xs" /> : null}
            </div>
        );
    };

    const renderCell = (
        index: number,
        field: keyof DailyReportDraftRow,
        display: ReactNode,
        input: ReactNode,
    ) => (isRowEditing(index) ? renderCellInput(index, field, input) : display);

    const locationSelect = (index: number, value: string) => (
        <MasterDataSelect
            value={value}
            options={routeOptions}
            emptyLabel="Select location"
            addLabel="+ Add location"
            addHref={routesHref}
            className={cellInputClass(Boolean(rowErrors[index]?.location))}
            onChange={(next) => updateDraftRow(index, 'location', next)}
        />
    );

    const partySelect = (
        index: number,
        field: 'current_party_id' | 'planning_party_id',
        value: string,
    ) => (
        <select
            className={cellInputClass(Boolean(rowErrors[index]?.[field]))}
            value={value}
            onChange={(e) => updateDraftRow(index, field, e.target.value)}
        >
            <option value="">Select party</option>
            {parties.map((party) => (
                <option key={party.id} value={party.id}>
                    {party.name}
                </option>
            ))}
        </select>
    );

    const descriptionTextarea = (index: number, value: string) => (
        <textarea
            rows={2}
            className={cellTextareaClass(Boolean(rowErrors[index]?.description))}
            value={value}
            placeholder="Trip / load description"
            onChange={(e) => updateDraftRow(index, 'description', e.target.value)}
        />
    );

    const renderRowActions = (index: number, fullWidth = false) => {
        if (!isRowEditing(index)) {
            return (
                <SecondaryButton
                    type="button"
                    className={
                        fullWidth
                            ? 'w-full !px-3 !py-1.5 text-xs normal-case tracking-normal'
                            : '!px-3 !py-1.5 text-xs normal-case tracking-normal'
                    }
                    disabled={editingRowIndex !== null && editingRowIndex !== index}
                    onClick={() => handleStartEditRow(index)}
                >
                    Edit
                </SecondaryButton>
            );
        }

        const dirty = rowSnapshot(draftRows[index]) !== (savedSnapshots[index] ?? '');
        const saving = savingRowIndex === index;
        const btnClass = fullWidth
            ? 'w-full !px-3 !py-1.5 text-xs normal-case tracking-normal'
            : '!px-3 !py-1.5 text-xs normal-case tracking-normal';

        return (
            <div className={fullWidth ? 'flex flex-col gap-2' : 'flex flex-col items-end gap-1.5 sm:flex-row sm:justify-end'}>
                <PrimaryButton
                    type="button"
                    className={btnClass}
                    disabled={!dirty || saving}
                    onClick={() => void handleSaveRow(index)}
                >
                    {saving ? 'Saving…' : 'Save'}
                </PrimaryButton>
                <SecondaryButton
                    type="button"
                    className={btnClass}
                    disabled={saving}
                    onClick={() => handleCancelEditRow(index)}
                >
                    Cancel
                </SecondaryButton>
            </div>
        );
    };

    return (
        <>
            <Head title="Daily Report" />

            <PageContainer className="space-y-4">
                {displayError && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {displayError}
                    </p>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                    <TotalCard label="Vehicles" value={String(totals.count)} />
                    <TotalCard label="Total Detention" value={`₹ ${formatMoney(totals.detention)}`} />
                </div>

                <ListFilterBar
                    dateValue={dateValue}
                    onDateChange={guardedDateChange}
                    search={{
                        value: searchInput,
                        placeholder: 'Search vehicle, party, location…',
                        onChange: setSearchInput,
                        onSubmit: () => {
                            if (!confirmLeaveDirtyRows()) {
                                return;
                            }

                            applySearch(searchInput);
                        },
                    }}
                    selects={[
                        {
                            name: 'vehicle_id',
                            label: 'Vehicle',
                            value: filters.vehicle_id ?? '',
                            options: (data?.vehicles ?? []).map((vehicle) => ({
                                value: String(vehicle.id),
                                label: vehicle.vehicle_number,
                            })),
                            onChange: (value) => guardedUpdateField('vehicle_id', value),
                        },
                        {
                            name: 'party_id',
                            label: 'Party',
                            value: filters.party_id ?? '',
                            options: parties.map((party) => ({
                                value: String(party.id),
                                label: party.name,
                            })),
                            onChange: (value) => guardedUpdateField('party_id', value),
                        },
                    ]}
                    filterSummary={filterSummary}
                    hasActiveFilters={hasActiveFilters}
                    onClear={() => {
                        if (!confirmLeaveDirtyRows()) {
                            return;
                        }

                        setSearchInput('');
                        clearFilters();
                    }}
                    actions={
                        <ListExportButtons onExport={(type) => void exportFiltered(type)} />
                    }
                />

                {!isSheetMode && (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        Select a single date to show all active vehicles. Click Edit on a row to
                        update it.
                    </p>
                )}

                {loading && !data ? (
                    <p className="text-center text-sm text-gray-500">Loading daily report…</p>
                ) : (
                    <ListingTableShell
                        isEmpty={draftRows.length === 0}
                        mobileCountLabel={`${draftRows.length} row${draftRows.length === 1 ? '' : 's'}`}
                        emptyMessage={
                            hasActiveFilters
                                ? 'No vehicles match your filters.'
                                : 'No active vehicles found. Add vehicles first.'
                        }
                        mobile={draftRows.map((row, index) => {
                            const hasRowError = Boolean(rowErrors[index]);
                            const dayLabel = formatReportDayLabel(
                                row.report_date,
                                row.day.trim() ? Number(row.day) : null,
                            );
                            const editing = isRowEditing(index);

                            return (
                                <div
                                    key={rowKey(row, index)}
                                    className={`rounded-lg border bg-white p-4 shadow-sm ${
                                        hasRowError ? 'border-red-200 bg-red-50/40' : 'border-gray-200'
                                    } ${editing ? 'ring-2 ring-indigo-200' : ''}`}
                                >
                                    <div className="mb-3 flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-xs text-gray-500">#{row.serial_number}</p>
                                            <p className="font-mono text-sm font-semibold text-gray-900">
                                                {row.vehicle_number || '—'}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {formatAppDateTime(row.report_date)}
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500">
                                                Description
                                            </label>
                                            <div className="mt-1">
                                                {renderCell(
                                                    index,
                                                    'description',
                                                    <p className="whitespace-pre-wrap text-sm text-gray-700">
                                                        {displayText(row.description)}
                                                    </p>,
                                                    descriptionTextarea(index, row.description),
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div>
                                                <label className="text-xs font-medium text-gray-500">
                                                    Current Party
                                                </label>
                                                <div className="mt-1">
                                                    {renderCell(
                                                        index,
                                                        'current_party_id',
                                                        row.current_party_id ? (
                                                            <PartyLink
                                                                partyId={Number(row.current_party_id)}
                                                                name={partyName(parties, row.current_party_id)}
                                                            />
                                                        ) : (
                                                            <span className="text-sm text-gray-700">—</span>
                                                        ),
                                                        partySelect(index, 'current_party_id', row.current_party_id),
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs font-medium text-gray-500">
                                                    Planning Party
                                                </label>
                                                <div className="mt-1">
                                                    {renderCell(
                                                        index,
                                                        'planning_party_id',
                                                        row.planning_party_id ? (
                                                            <PartyLink
                                                                partyId={Number(row.planning_party_id)}
                                                                name={partyName(parties, row.planning_party_id)}
                                                            />
                                                        ) : (
                                                            <span className="text-sm text-gray-700">—</span>
                                                        ),
                                                        partySelect(index, 'planning_party_id', row.planning_party_id),
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-gray-500">
                                                Location
                                            </label>
                                            <div className="mt-1">
                                                {renderCell(
                                                    index,
                                                    'location',
                                                    <p className="text-sm text-gray-700">
                                                        {displayText(row.location)}
                                                    </p>,
                                                    locationSelect(index, row.location),
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-medium text-gray-500">
                                                    Detention
                                                </label>
                                                <div className="mt-1">
                                                    {renderCell(
                                                        index,
                                                        'detention',
                                                        <p className="text-sm text-gray-700">
                                                            ₹ {formatMoney(row.detention)}
                                                        </p>,
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            className={cellInputClass(
                                                                Boolean(rowErrors[index]?.detention),
                                                            )}
                                                            value={row.detention}
                                                            onChange={(e) =>
                                                                updateDraftRow(index, 'detention', e.target.value)
                                                            }
                                                        />,
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs font-medium text-gray-500">
                                                    Day
                                                </label>
                                                <div className="mt-1">
                                                    {renderCell(
                                                        index,
                                                        'day',
                                                        <p className="text-sm text-gray-700">{dayLabel}</p>,
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className={cellInputClass(Boolean(rowErrors[index]?.day))}
                                                            value={row.day}
                                                            onChange={(e) =>
                                                                updateDraftRow(index, 'day', e.target.value)
                                                            }
                                                            placeholder="Optional"
                                                        />,
                                                    )}
                                                    {editing ? (
                                                        <p className="mt-0.5 text-xs text-gray-500">{dayLabel}</p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>

                                        {renderRowActions(index, true)}
                                    </div>
                                </div>
                            );
                        })}
                        thead={
                            <tr className="bg-gray-50">
                                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                    #
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Vehicle
                                </th>
                                <th className="min-w-[12rem] px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Description
                                </th>
                                <th className="min-w-[9rem] px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Current Party
                                </th>
                                <th className="min-w-[9rem] px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Planning Party
                                </th>
                                <th className="min-w-[8rem] px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Location
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Date
                                </th>
                                <th className="min-w-[6rem] px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Detention
                                </th>
                                <th className="min-w-[6rem] px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Day
                                </th>
                                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Actions
                                </th>
                            </tr>
                        }
                        tbody={draftRows.map((row, index) => {
                            const hasRowError = Boolean(rowErrors[index]);
                            const dayLabel = formatReportDayLabel(
                                row.report_date,
                                row.day.trim() ? Number(row.day) : null,
                            );
                            const editing = isRowEditing(index);

                            return (
                                <tr
                                    key={rowKey(row, index)}
                                    className={
                                        hasRowError
                                            ? 'bg-red-50/70'
                                            : editing
                                              ? 'bg-indigo-50/40'
                                              : index % 2 === 1
                                                ? 'bg-gray-50/60'
                                                : 'bg-white'
                                    }
                                >
                                    <td className="whitespace-nowrap px-3 py-2 text-sm font-medium text-gray-700">
                                        {index + 1}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 font-mono text-sm text-gray-900">
                                        {row.vehicle_number || '—'}
                                    </td>
                                    <td className="min-w-[12rem] max-w-[16rem] px-3 py-2 align-top text-sm text-gray-700">
                                        {renderCell(
                                            index,
                                            'description',
                                            <span className="whitespace-pre-wrap">
                                                {displayText(row.description)}
                                            </span>,
                                            descriptionTextarea(index, row.description),
                                        )}
                                    </td>
                                    <td className="px-3 py-2 align-top text-sm text-gray-700">
                                        {renderCell(
                                            index,
                                            'current_party_id',
                                            row.current_party_id ? (
                                                <PartyLink
                                                    partyId={Number(row.current_party_id)}
                                                    name={partyName(parties, row.current_party_id)}
                                                />
                                            ) : (
                                                '—'
                                            ),
                                            partySelect(index, 'current_party_id', row.current_party_id),
                                        )}
                                    </td>
                                    <td className="px-3 py-2 align-top text-sm text-gray-700">
                                        {renderCell(
                                            index,
                                            'planning_party_id',
                                            row.planning_party_id ? (
                                                <PartyLink
                                                    partyId={Number(row.planning_party_id)}
                                                    name={partyName(parties, row.planning_party_id)}
                                                />
                                            ) : (
                                                '—'
                                            ),
                                            partySelect(index, 'planning_party_id', row.planning_party_id),
                                        )}
                                    </td>
                                    <td className="px-3 py-2 align-top text-sm text-gray-700">
                                        {renderCell(
                                            index,
                                            'location',
                                            displayText(row.location),
                                            locationSelect(index, row.location),
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-700">
                                        {formatAppDateTime(row.report_date)}
                                    </td>
                                    <td className="px-3 py-2 align-top text-sm text-gray-700">
                                        {renderCell(
                                            index,
                                            'detention',
                                            <span className="block text-right">
                                                ₹ {formatMoney(row.detention)}
                                            </span>,
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className={`${cellInputClass(Boolean(rowErrors[index]?.detention))} text-right`}
                                                value={row.detention}
                                                onChange={(e) =>
                                                    updateDraftRow(index, 'detention', e.target.value)
                                                }
                                            />,
                                        )}
                                    </td>
                                    <td className="px-3 py-2 align-top text-sm text-gray-700">
                                        {renderCell(
                                            index,
                                            'day',
                                            dayLabel,
                                            <input
                                                type="number"
                                                min="1"
                                                className={cellInputClass(Boolean(rowErrors[index]?.day))}
                                                value={row.day}
                                                onChange={(e) => updateDraftRow(index, 'day', e.target.value)}
                                                placeholder="Optional"
                                            />,
                                        )}
                                        {editing ? (
                                            <p className="mt-0.5 text-xs text-gray-500">{dayLabel}</p>
                                        ) : null}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 text-right align-top">
                                        {renderRowActions(index)}
                                    </td>
                                </tr>
                            );
                        })}
                    />
                )}
            </PageContainer>
        </>
    );
}
