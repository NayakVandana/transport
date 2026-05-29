import FormDatePicker, { type DatePickerRangeValue } from '@/Components/FormDatePicker';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { authenticatedPageLayout } from '@/Layouts/authenticatedPageLayout';
import { appApiDownload, appApiPost, type ApiEnvelope } from '@/api/appClient';
import { buildBookingFilterParams, type BookingDateRange } from '@/lib/bookingDateFilter';
import { formatMoney } from '@/lib/freightCalculator';
import type { Booking, BookingTotals, Vehicle } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Paginated {
    data: Booking[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Filters {
    vehicle_id: string;
    date_range: BookingDateRange;
    date_from: string;
    date_to: string;
}

type BookingsListData = {
    bookings: Paginated;
    vehicles: Pick<Vehicle, 'id' | 'vehicle_number'>[];
    filters: Filters;
    totals: BookingTotals;
    filterSummary: string;
};

const defaultFilters: Filters = {
    vehicle_id: '',
    date_range: 'all',
    date_from: '',
    date_to: '',
};

function filtersFromForm(
    form: HTMLFormElement,
    dates: DatePickerRangeValue,
): Filters {
    const formData = new FormData(form);

    return {
        vehicle_id: formData.get('vehicle_id')?.toString() ?? '',
        date_range: dates.startDate ? 'custom' : 'all',
        date_from: dates.startDate ?? '',
        date_to: dates.endDate ?? dates.startDate ?? '',
    };
}

function datesFromFilters(filters: Filters): DatePickerRangeValue {
    if (filters.date_range === 'all' || !filters.date_from) {
        return { startDate: null, endDate: null };
    }

    return {
        startDate: filters.date_from,
        endDate: filters.date_to || filters.date_from,
    };
}

export default function BookingsIndex() {
    const filterFormRef = useRef<HTMLFormElement>(null);
    const [bookings, setBookings] = useState<Paginated | null>(null);
    const [vehicles, setVehicles] = useState<Pick<Vehicle, 'id' | 'vehicle_number'>[]>([]);
    const [filters, setFilters] = useState<Filters>(defaultFilters);
    const [totals, setTotals] = useState<BookingTotals>({
        count: 0,
        freight: 0,
        advance: 0,
        empty_charge: 0,
        maintenance: 0,
        balance: 0,
    });
    const [filterSummary, setFilterSummary] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [dateValue, setDateValue] = useState<DatePickerRangeValue>({ startDate: null, endDate: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadBookings = useCallback(
        async (page = 1, nextFilters?: Filters) => {
            const activeFilters = nextFilters ?? filters;

            setLoading(true);
            setError(null);

            try {
                const res = await appApiPost<ApiEnvelope<BookingsListData>>(
                    '/bookings/bookings-list',
                    {
                        ...buildBookingFilterParams(activeFilters),
                        current_page: page,
                    },
                );

                if (!res.success || !res.data) {
                    setError(res.message || 'Could not load bookings.');
                    return;
                }

                setBookings(res.data.bookings);
                setVehicles(res.data.vehicles);
                setFilters(res.data.filters);
                setTotals(res.data.totals);
                setFilterSummary(res.data.filterSummary);
                setDateValue(datesFromFilters(res.data.filters));
                setCurrentPage(res.data.bookings.current_page);
            } catch {
                setError('Could not load bookings.');
            } finally {
                setLoading(false);
            }
        },
        [filters],
    );

    useEffect(() => {
        void loadBookings(1);
    }, []);

    const getVehicleId = (): string => {
        if (!filterFormRef.current) {
            return filters.vehicle_id;
        }

        return new FormData(filterFormRef.current).get('vehicle_id')?.toString() ?? '';
    };

    const applyDateFilter = (dates: DatePickerRangeValue) => {
        setDateValue(dates);

        if (!dates.startDate) {
            void loadBookings(1, {
                vehicle_id: getVehicleId(),
                date_range: 'all',
                date_from: '',
                date_to: '',
            });
            return;
        }

        void loadBookings(1, {
            vehicle_id: getVehicleId(),
            date_range: 'custom',
            date_from: dates.startDate,
            date_to: dates.endDate ?? dates.startDate,
        });
    };

    const applyVehicleFilter = () => {
        if (!filterFormRef.current) {
            return;
        }

        void loadBookings(1, filtersFromForm(filterFormRef.current, dateValue));
    };

    const clearFilters = () => {
        setDateValue({ startDate: null, endDate: null });
        void loadBookings(1, defaultFilters);
    };

    const exportFiltered = async (type: 'csv' | 'pdf') => {
        const activeFilters = filterFormRef.current
            ? filtersFromForm(filterFormRef.current, dateValue)
            : filters;

        const params = buildBookingFilterParams(activeFilters);
        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

        try {
            await appApiDownload(
                type === 'csv' ? '/bookings/bookings-export-csv' : '/bookings/bookings-export-pdf',
                params,
                `bookings-${stamp}.${type}`,
            );
        } catch {
            setError(`Could not export ${type.toUpperCase()}.`);
        }
    };

    const destroy = async (id: number) => {
        if (!confirm('Remove this booking?')) {
            return;
        }

        const res = await appApiPost<ApiEnvelope<null>>('/bookings/booking-destroy', { id });

        if (!res.success) {
            setError(res.message || 'Could not remove booking.');
            return;
        }

        void loadBookings(currentPage);
    };

    const hasFilters = Boolean(filters.vehicle_id || filters.date_range !== 'all');

    return (
        <>
            <Head title="Bookings" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-4 sm:px-6 lg:px-8">
                    {error && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {error}
                        </p>
                    )}

                    <form ref={filterFormRef} className="rounded-lg bg-white p-3 shadow">
                        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                            <FormDatePicker
                                id="booking_date_range"
                                name="booking_date_range"
                                value={dateValue}
                                onChange={applyDateFilter}
                                isRange
                                useRange
                            />

                            <div className="flex shrink-0 items-center gap-1.5 border-l border-gray-200 pl-2">
                                <label htmlFor="vehicle_id" className="sr-only">
                                    Vehicle
                                </label>
                                <select
                                    id="vehicle_id"
                                    name="vehicle_id"
                                    defaultValue={filters.vehicle_id}
                                    onChange={applyVehicleFilter}
                                    className="w-[9.5rem] rounded-md border-gray-300 py-1 pl-2 pr-7 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">All vehicles</option>
                                    {vehicles.map((vehicle) => (
                                        <option key={vehicle.id} value={vehicle.id}>
                                            {vehicle.vehicle_number}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex h-8 w-[3.25rem] shrink-0 items-center">
                                <SecondaryButton
                                    type="button"
                                    onClick={clearFilters}
                                    tabIndex={hasFilters ? 0 : -1}
                                    className={`!px-2.5 !py-1 normal-case tracking-normal ${
                                        hasFilters ? '' : 'pointer-events-none invisible'
                                    }`}
                                >
                                    Clear
                                </SecondaryButton>
                            </div>

                            <div className="ml-auto flex shrink-0 items-center gap-2 lg:min-w-[12rem] lg:justify-end">
                                <span className="hidden text-xs text-gray-500 sm:inline">
                                    {filterSummary}
                                </span>
                                <SecondaryButton
                                    type="button"
                                    onClick={() => void exportFiltered('csv')}
                                    className="!px-2.5 !py-1 normal-case tracking-normal"
                                >
                                    CSV
                                </SecondaryButton>
                                <SecondaryButton
                                    type="button"
                                    onClick={() => void exportFiltered('pdf')}
                                    className="!px-2.5 !py-1 normal-case tracking-normal"
                                >
                                    PDF
                                </SecondaryButton>
                            </div>
                        </div>

                        <p className="mt-1.5 text-xs text-gray-500 sm:hidden">{filterSummary}</p>
                    </form>

                    {loading ? (
                        <p className="text-center text-sm text-gray-500">Loading bookings…</p>
                    ) : (
                        <>
                            {totals.count > 0 && (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                                    <TotalCard label="Bookings" value={String(totals.count)} />
                                    <TotalCard label="Freight" value={`₹ ${formatMoney(totals.freight)}`} />
                                    <TotalCard label="Advance" value={`₹ ${formatMoney(totals.advance)}`} />
                                    <TotalCard label="Empty" value={`₹ ${formatMoney(totals.empty_charge)}`} />
                                    <TotalCard
                                        label="Maintenance"
                                        value={`₹ ${formatMoney(totals.maintenance)}`}
                                    />
                                    <TotalCard label="Balance" value={`₹ ${formatMoney(totals.balance)}`} />
                                </div>
                            )}

                            <div className="overflow-x-auto rounded-lg bg-white shadow">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                                Date
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                                Vehicle
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                                                Freight
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                                                Advance
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                                                Empty
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                                                Maintenance
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                                                Balance
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {!bookings || bookings.data.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={8}
                                                    className="px-6 py-8 text-center text-gray-500"
                                                >
                                                    {hasFilters
                                                        ? 'No bookings match your filters.'
                                                        : 'No bookings yet.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            bookings.data.map((booking) => (
                                                <tr key={booking.id}>
                                                    <td className="px-4 py-3">
                                                        {booking.booking_date?.slice(0, 10)}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono font-medium">
                                                        {booking.vehicle?.vehicle_number ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        ₹ {formatMoney(booking.freight)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        ₹ {formatMoney(booking.advance)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        ₹ {formatMoney(booking.empty_charge)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        ₹ {formatMoney(booking.maintenance)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">
                                                        ₹ {formatMoney(booking.balance)}
                                                    </td>
                                                    <td className="space-x-3 px-4 py-3 text-right">
                                                        <Link
                                                            href={route('bookings.edit', booking.id)}
                                                            className="text-indigo-600 hover:underline"
                                                        >
                                                            Edit
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => void destroy(booking.id)}
                                                            className="text-red-600 hover:underline"
                                                        >
                                                            Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    {totals.count > 0 && (
                                        <tfoot className="bg-gray-50 font-semibold">
                                            <tr>
                                                <td className="px-4 py-3" colSpan={2}>
                                                    Total ({totals.count})
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    ₹ {formatMoney(totals.freight)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    ₹ {formatMoney(totals.advance)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    ₹ {formatMoney(totals.empty_charge)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    ₹ {formatMoney(totals.maintenance)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    ₹ {formatMoney(totals.balance)}
                                                </td>
                                                <td />
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>

                            {bookings && bookings.last_page > 1 && (
                                <div className="flex flex-wrap gap-1">
                                    {Array.from({ length: bookings.last_page }, (_, i) => i + 1).map(
                                        (page) => (
                                            <button
                                                key={page}
                                                type="button"
                                                onClick={() => void loadBookings(page)}
                                                className={`rounded px-3 py-1 text-sm ${
                                                    page === bookings.current_page
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-white text-gray-700 shadow hover:bg-gray-50'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ),
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

BookingsIndex.layout = authenticatedPageLayout(
    <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-800">Bookings</h2>
        <Link href={route('bookings.create')}>
            <PrimaryButton>Add Booking</PrimaryButton>
        </Link>
    </div>,
);

function TotalCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
        </div>
    );
}
