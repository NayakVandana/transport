<?php

namespace App\Support;

use App\Models\Booking;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;

class BookingReport
{
    /** @return array{vehicle_id: string, date_range: string, date_from: string, date_to: string} */
    public static function filtersFromRequest(Request $request, int $userId): array
    {
        $validated = $request->validate([
            'vehicle_id' => ['nullable', 'integer'],
            'date_range' => ['nullable', 'string', 'in:'.implode(',', BookingDateFilter::PRESETS)],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
        ]);

        $dateRange = BookingDateFilter::normalizeRange(
            $validated['date_range'] ?? null,
            $validated['date_from'] ?? '',
            $validated['date_to'] ?? '',
        );

        [$dateFrom, $dateTo] = BookingDateFilter::resolveDates(
            $dateRange,
            $validated['date_from'] ?? '',
            $validated['date_to'] ?? '',
        );

        $vehicleId = isset($validated['vehicle_id'])
            ? (string) $validated['vehicle_id']
            : '';

        if ($vehicleId !== '') {
            $ownsVehicle = Vehicle::query()
                ->where('user_id', $userId)
                ->whereKey($vehicleId)
                ->exists();

            if (! $ownsVehicle) {
                $vehicleId = '';
            }
        }

        return [
            'vehicle_id' => $vehicleId,
            'date_range' => $dateRange,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
        ];
    }

    /** @return Collection<int, Vehicle> */
    public static function vehiclesForUser(int $userId): Collection
    {
        return Vehicle::query()
            ->where('user_id', $userId)
            ->orderBy('vehicle_number')
            ->get(['id', 'vehicle_number']);
    }

    /** @param  array{vehicle_id: string, date_range: string, date_from: string, date_to: string}  $filters */
    public static function filteredQuery(int $userId, array $filters): Builder
    {
        return Booking::query()
            ->with('vehicle:id,vehicle_number')
            ->where('user_id', $userId)
            ->when($filters['vehicle_id'], fn ($query, $vehicleId) => $query->where('vehicle_id', $vehicleId))
            ->when($filters['date_from'], fn ($query, $dateFrom) => $query->whereDate('booking_date', '>=', $dateFrom))
            ->when($filters['date_to'], fn ($query, $dateTo) => $query->whereDate('booking_date', '<=', $dateTo))
            ->orderByDesc('booking_date')
            ->orderByDesc('id');
    }

    /** @return array{count: int, freight: float, advance: float, empty_charge: float, maintenance: float, balance: float} */
    public static function totals(Builder $query): array
    {
        $totals = (clone $query)->toBase()->selectRaw(
            'COUNT(*) as count,
            COALESCE(SUM(freight), 0) as freight,
            COALESCE(SUM(advance), 0) as advance,
            COALESCE(SUM(empty_charge), 0) as empty_charge,
            COALESCE(SUM(maintenance), 0) as maintenance,
            COALESCE(SUM(balance), 0) as balance',
        )->first();

        return [
            'count' => (int) ($totals->count ?? 0),
            'freight' => round((float) ($totals->freight ?? 0), 2),
            'advance' => round((float) ($totals->advance ?? 0), 2),
            'empty_charge' => round((float) ($totals->empty_charge ?? 0), 2),
            'maintenance' => round((float) ($totals->maintenance ?? 0), 2),
            'balance' => round((float) ($totals->balance ?? 0), 2),
        ];
    }

    /**
     * @param  array{vehicle_id: string, date_range: string, date_from: string, date_to: string}  $filters
     * @param  Collection<int, Vehicle>  $vehicles
     */
    public static function filterSummary(array $filters, Collection $vehicles): string
    {
        $parts = [];

        if ($filters['vehicle_id']) {
            $vehicle = $vehicles->firstWhere('id', (int) $filters['vehicle_id']);
            $parts[] = 'Vehicle: '.($vehicle?->vehicle_number ?? 'All');
        }

        $dateRange = $filters['date_range'] ?? 'all';

        if ($dateRange === 'custom') {
            if ($filters['date_from']) {
                $parts[] = 'From: '.$filters['date_from'];
            }
            if ($filters['date_to']) {
                $parts[] = 'To: '.$filters['date_to'];
            }
        } elseif ($dateRange !== 'all') {
            $parts[] = 'Period: '.BookingDateFilter::label($dateRange);
        }

        return $parts === [] ? 'All bookings' : implode(' | ', $parts);
    }

    public static function formatMoney(float|int|string $amount): string
    {
        return number_format((float) $amount, 2, '.', ',');
    }
}
