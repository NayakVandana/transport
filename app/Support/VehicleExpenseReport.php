<?php

namespace App\Support;

use App\Models\Vehicle;
use App\Models\VehicleExpense;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class VehicleExpenseReport
{
    /** @return Collection<int, Vehicle> */
    public static function vehiclesForUser(int $userId): Collection
    {
        return Vehicle::query()
            ->where('user_id', $userId)
            ->orderBy('vehicle_number')
            ->get(['id', 'vehicle_number']);
    }

    /** @return array<string, string> */
    public static function filtersFromRequest(Request $request, int $userId): array
    {
        $dateFilters = ListFilter::dateFromRequest($request);
        $search = ListFilter::searchFromRequest($request);
        $vehicleId = ListFilter::optionalIdFromRequest($request, 'vehicle_id');

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
            'search' => $search,
            'vehicle_id' => $vehicleId,
            ...$dateFilters,
        ];
    }

    /** @param  array<string, string>  $filters */
    public static function filteredQuery(int $userId, array $filters): Builder
    {
        $query = VehicleExpense::query()
            ->with(['vehicle:id,vehicle_number'])
            ->where('user_id', $userId);

        ListFilter::applyDate($query, $filters, 'expense_date');

        $search = $filters['search'] ?? '';
        if ($search !== '') {
            $query->whereHas('vehicle', fn (Builder $builder) => $builder->where('vehicle_number', 'like', "%{$search}%"));
        }

        if (($filters['vehicle_id'] ?? '') !== '') {
            $query->where('vehicle_id', $filters['vehicle_id']);
        }

        return $query->orderByDesc('expense_date')->orderByDesc('id');
    }

    /** @param  array<string, string>  $filters */
    public static function filterSummary(array $filters, Collection $vehicles): string
    {
        $vehicleLabel = ($filters['vehicle_id'] ?? '') !== ''
            ? 'Vehicle: '.($vehicles->firstWhere('id', (int) $filters['vehicle_id'])?->vehicle_number ?? 'All')
            : null;

        return ListFilter::summary([
            ($filters['search'] ?? '') !== '' ? 'Search: '.$filters['search'] : null,
            $vehicleLabel,
            ListFilter::dateSummary($filters),
        ], 'All vehicle expenses');
    }

    /** @return array{count: int, freight: float, advance: float, empty_charge: float, toll: float, maintenance: float, balance: float} */
    public static function totals(Builder $query): array
    {
        $base = (clone $query)->toBase();

        return [
            'count' => (int) (clone $base)->count(),
            'freight' => round((float) (clone $base)->sum('freight'), 2),
            'advance' => round((float) (clone $base)->sum('advance'), 2),
            'empty_charge' => round((float) (clone $base)->sum('empty_charge'), 2),
            'toll' => round((float) (clone $base)->sum('toll'), 2),
            'maintenance' => round((float) (clone $base)->sum('maintenance'), 2),
            'balance' => round((float) (clone $base)->sum('balance'), 2),
        ];
    }

    public static function formatMoney(float|string|null $amount): string
    {
        return number_format((float) $amount, 2, '.', ',');
    }
}
