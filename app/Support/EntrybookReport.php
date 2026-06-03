<?php

namespace App\Support;

use App\Models\Entrybook;
use App\Models\Party;
use App\Models\Location;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class EntrybookReport
{
    /** @return Collection<int, Party> */
    public static function partiesForUser(int $userId): Collection
    {
        return Party::query()
            ->where('user_id', $userId)
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    /** @return Collection<int, Vehicle> */
    public static function vehiclesForUser(int $userId): Collection
    {
        return Vehicle::query()
            ->where('user_id', $userId)
            ->orderBy('vehicle_number')
            ->get(['id', 'vehicle_number']);
    }

    /** @return Collection<int, Location> */
    public static function locationsForUser(int $userId): Collection
    {
        return Location::query()
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    /** @return Collection<int, Location> */
    public static function routesForUser(int $userId): Collection
    {
        return self::locationsForUser($userId);
    }

    /** @return array<string, string> */
    public static function filtersFromRequest(Request $request, int $userId): array
    {
        $dateFilters = ListFilter::dateFromRequest($request);
        $search = ListFilter::searchFromRequest($request);
        $vehicleId = ListFilter::optionalIdFromRequest($request, 'vehicle_id');
        $partyId = ListFilter::optionalIdFromRequest($request, 'party_id');

        if ($vehicleId !== '') {
            $ownsVehicle = Vehicle::query()
                ->where('user_id', $userId)
                ->whereKey($vehicleId)
                ->exists();
            if (! $ownsVehicle) {
                $vehicleId = '';
            }
        }

        if ($partyId !== '') {
            $ownsParty = Party::query()
                ->where('user_id', $userId)
                ->whereKey($partyId)
                ->exists();
            if (! $ownsParty) {
                $partyId = '';
            }
        }

        $routeFrom = trim($request->input('route_from') ?? '');
        if ($routeFrom !== '') {
            $ownsRoute = Location::query()
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
            'party_id' => $partyId,
            'route_from' => $routeFrom,
            ...$dateFilters,
        ];
    }

    /** @param  array<string, string>  $filters */
    public static function filteredQuery(int $userId, array $filters): Builder
    {
        $query = Entrybook::query()
            ->with([
                'vehicle:id,vehicle_number',
                'party:id,name',
                'invoiceLine.freightInvoice:id,bill_number',
            ])
            ->where('user_id', $userId);

        ListFilter::applyDate($query, $filters, 'entry_date');

        $search = $filters['search'] ?? '';
        if ($search !== '') {
            $query->where(function (Builder $builder) use ($search) {
                $builder
                    ->where('entry_number', 'like', "%{$search}%")
                    ->orWhere('route_from', 'like', "%{$search}%")
                    ->orWhereHas('party', fn (Builder $q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        if (($filters['vehicle_id'] ?? '') !== '') {
            $query->where('vehicle_id', $filters['vehicle_id']);
        }

        if (($filters['party_id'] ?? '') !== '') {
            $query->where('party_id', $filters['party_id']);
        }

        if (($filters['route_from'] ?? '') !== '') {
            $query->where('route_from', $filters['route_from']);
        }

        return $query->orderByDesc('entry_date')->orderByDesc('id');
    }

    /** @param  array<string, string>  $filters */
    public static function filterSummary(array $filters, Collection $vehicles, Collection $routes, Collection $parties): string
    {
        $vehicleLabel = ($filters['vehicle_id'] ?? '') !== ''
            ? 'Vehicle: '.($vehicles->firstWhere('id', (int) $filters['vehicle_id'])?->vehicle_number ?? 'All')
            : null;

        $partyLabel = ($filters['party_id'] ?? '') !== ''
            ? 'Party: '.($parties->firstWhere('id', (int) $filters['party_id'])?->name ?? 'All')
            : null;

        $routeLabel = ($filters['route_from'] ?? '') !== ''
            ? 'Route: '.$filters['route_from']
            : null;

        return ListFilter::summary([
            ($filters['search'] ?? '') !== '' ? 'Search: '.$filters['search'] : null,
            $vehicleLabel,
            $partyLabel,
            $routeLabel,
            ListFilter::dateSummary($filters),
        ], 'All entries');
    }

    /** @return array{count: int, freight: float, advance: float, detention: float, balance: float} */
    public static function totals(Builder $query): array
    {
        $base = (clone $query)->toBase();

        return [
            'count' => (int) (clone $base)->count(),
            'freight' => round((float) (clone $base)->sum('freight'), 2),
            'advance' => round((float) (clone $base)->sum('advance'), 2),
            'detention' => round((float) (clone $base)->sum('detention'), 2),
            'balance' => round((float) (clone $base)->sum('balance'), 2),
        ];
    }

    public static function formatMoney(float|string|null $amount): string
    {
        return number_format((float) $amount, 2, '.', ',');
    }
}
