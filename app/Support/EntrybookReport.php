<?php

namespace App\Support;

use App\Models\Entrybook;
use App\Models\RouteLocation;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class EntrybookReport
{
    /** @return Collection<int, Vehicle> */
    public static function vehiclesForUser(int $userId): Collection
    {
        return Vehicle::query()
            ->where('user_id', $userId)
            ->orderBy('vehicle_number')
            ->get(['id', 'vehicle_number']);
    }

    /** @return Collection<int, RouteLocation> */
    public static function routesForUser(int $userId): Collection
    {
        return RouteLocation::query()
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);
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

        $routeFrom = trim($request->input('route_from') ?? '');
        if ($routeFrom !== '') {
            $ownsRoute = RouteLocation::query()
                ->where('user_id', $userId)
                ->where('is_active', true)
                ->where('name', $routeFrom)
                ->exists();
            if (! $ownsRoute) {
                $routeFrom = '';
            }
        }

        return [
            'search' => $search,
            'vehicle_id' => $vehicleId,
            'route_from' => $routeFrom,
            ...$dateFilters,
        ];
    }

    /** @param  array<string, string>  $filters */
    public static function filteredQuery(int $userId, array $filters): Builder
    {
        $query = Entrybook::query()
            ->with(['vehicle:id,vehicle_number'])
            ->where('user_id', $userId);

        ListFilter::applyDate($query, $filters, 'entry_date');
        ListFilter::applySearch($query, $filters['search'] ?? '', ['entry_number', 'route_from']);

        if (($filters['vehicle_id'] ?? '') !== '') {
            $query->where('vehicle_id', $filters['vehicle_id']);
        }

        if (($filters['route_from'] ?? '') !== '') {
            $query->where('route_from', $filters['route_from']);
        }

        return $query->orderByDesc('entry_date')->orderByDesc('id');
    }

    /** @param  array<string, string>  $filters */
    public static function filterSummary(array $filters, Collection $vehicles, Collection $routes): string
    {
        $vehicleLabel = ($filters['vehicle_id'] ?? '') !== ''
            ? 'Vehicle: '.($vehicles->firstWhere('id', (int) $filters['vehicle_id'])?->vehicle_number ?? 'All')
            : null;

        $routeLabel = ($filters['route_from'] ?? '') !== ''
            ? 'Route: '.$filters['route_from']
            : null;

        return ListFilter::summary([
            ($filters['search'] ?? '') !== '' ? 'Search: '.$filters['search'] : null,
            $vehicleLabel,
            $routeLabel,
            ListFilter::dateSummary($filters),
        ], 'All entries');
    }

    /** @return array{count: int, freight: float, advance: float, balance: float} */
    public static function totals(Builder $query): array
    {
        $base = (clone $query)->toBase();

        return [
            'count' => (int) (clone $base)->count(),
            'freight' => round((float) (clone $base)->sum('freight'), 2),
            'advance' => round((float) (clone $base)->sum('advance'), 2),
            'balance' => round((float) (clone $base)->sum('balance'), 2),
        ];
    }

    public static function formatMoney(float|string|null $amount): string
    {
        return number_format((float) $amount, 2, '.', ',');
    }
}
