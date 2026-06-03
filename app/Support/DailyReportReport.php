<?php

namespace App\Support;

use App\Models\DailyReport;
use App\Models\Party;
use App\Models\Location;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class DailyReportReport
{
    /** @return Collection<int, Vehicle> */
    public static function vehiclesForUser(int $userId): Collection
    {
        return Vehicle::query()
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->orderBy('vehicle_number')
            ->get(['id', 'vehicle_number']);
    }

    public static function singleReportDate(array $filters): ?string
    {
        $from = $filters['date_from'] ?? '';
        $to = $filters['date_to'] ?? $from;

        if ($from === '') {
            return now()->toDateString();
        }

        if ($to !== '' && $to !== $from) {
            return null;
        }

        return $from;
    }

    /**
     * One row per active vehicle for a single report date (saved data merged in).
     *
     * @param  array<string, string>  $filters
     * @return list<array<string, mixed>>
     */
    public static function vehicleWiseRowsForDate(int $userId, string $reportDate, array $filters): array
    {
        $vehiclesQuery = Vehicle::query()
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->orderBy('vehicle_number');

        if (($filters['vehicle_id'] ?? '') !== '') {
            $vehiclesQuery->whereKey($filters['vehicle_id']);
        }

        $reportsByVehicle = DailyReport::query()
            ->with([
                'vehicle:id,vehicle_number',
                'currentParty:id,name',
                'planningParty:id,name',
            ])
            ->where('user_id', $userId)
            ->whereDate('report_date', $reportDate)
            ->orderBy('serial_number')
            ->get()
            ->unique('vehicle_id')
            ->keyBy('vehicle_id');

        $rows = [];
        $serial = 1;

        foreach ($vehiclesQuery->get(['id', 'vehicle_number']) as $vehicle) {
            /** @var DailyReport|null $report */
            $report = $reportsByVehicle->get($vehicle->id);

            if ($report !== null) {
                $row = $report->toArray();
            } else {
                $row = [
                    'id' => null,
                    'serial_number' => $serial,
                    'report_date' => $reportDate,
                    'vehicle_id' => $vehicle->id,
                    'description' => null,
                    'current_party_id' => null,
                    'planning_party_id' => null,
                    'location' => null,
                    'detention' => 0,
                    'day' => null,
                    'vehicle' => [
                        'id' => $vehicle->id,
                        'vehicle_number' => $vehicle->vehicle_number,
                    ],
                    'current_party' => null,
                    'planning_party' => null,
                ];
            }

            if (! self::rowMatchesFilters($row, $filters)) {
                continue;
            }

            $row['serial_number'] = $serial;
            $rows[] = $row;
            $serial++;
        }

        return $rows;
    }

    /** @param  array<string, mixed>  $row  @param  array<string, string>  $filters */
    public static function rowMatchesFilters(array $row, array $filters): bool
    {
        $partyId = (int) ($filters['party_id'] ?? 0);
        if ($partyId > 0) {
            $currentPartyId = (int) ($row['current_party_id'] ?? 0);
            $planningPartyId = (int) ($row['planning_party_id'] ?? 0);

            if ($currentPartyId !== $partyId && $planningPartyId !== $partyId) {
                return false;
            }
        }

        $search = strtolower(trim($filters['search'] ?? ''));
        if ($search === '') {
            return true;
        }

        $vehicleNumber = strtolower((string) ($row['vehicle']['vehicle_number'] ?? ''));
        $description = strtolower((string) ($row['description'] ?? ''));
        $location = strtolower((string) ($row['location'] ?? ''));
        $currentParty = strtolower((string) ($row['current_party']['name'] ?? $row['currentParty']['name'] ?? ''));
        $planningParty = strtolower((string) ($row['planning_party']['name'] ?? $row['planningParty']['name'] ?? ''));

        return str_contains($vehicleNumber, $search)
            || str_contains($description, $search)
            || str_contains($location, $search)
            || str_contains($currentParty, $search)
            || str_contains($planningParty, $search);
    }

    /** @param  list<array<string, mixed>>  $rows */
    public static function totalsFromRows(array $rows): array
    {
        $detention = 0.0;

        foreach ($rows as $row) {
            $detention += (float) ($row['detention'] ?? 0);
        }

        return [
            'count' => count($rows),
            'detention' => round($detention, 2),
        ];
    }

    /** @return Collection<int, Party> */
    public static function partiesForUser(int $userId): Collection
    {
        return Party::query()
            ->where('user_id', $userId)
            ->orderBy('name')
            ->get(['id', 'name']);
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

        return [
            'search' => $search,
            'vehicle_id' => $vehicleId,
            'party_id' => $partyId,
            ...$dateFilters,
        ];
    }

    /** @param  array<string, string>  $filters */
    public static function filteredQuery(int $userId, array $filters): Builder
    {
        $query = DailyReport::query()
            ->with([
                'vehicle:id,vehicle_number',
                'currentParty:id,name',
                'planningParty:id,name',
            ])
            ->where('user_id', $userId);

        ListFilter::applyDate($query, $filters, 'report_date');

        $search = $filters['search'] ?? '';
        if ($search !== '') {
            $query->where(function (Builder $builder) use ($search) {
                $builder
                    ->where('description', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhereHas('vehicle', fn (Builder $q) => $q->where('vehicle_number', 'like', "%{$search}%"))
                    ->orWhereHas('currentParty', fn (Builder $q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('planningParty', fn (Builder $q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        if (($filters['vehicle_id'] ?? '') !== '') {
            $query->where('vehicle_id', $filters['vehicle_id']);
        }

        if (($filters['party_id'] ?? '') !== '') {
            $partyId = (int) $filters['party_id'];
            $query->where(function (Builder $builder) use ($partyId) {
                $builder
                    ->where('current_party_id', $partyId)
                    ->orWhere('planning_party_id', $partyId);
            });
        }

        return $query
            ->orderByDesc('report_date')
            ->orderBy('serial_number');
    }

    /** @param  array<string, string>  $filters */
    public static function filterSummary(array $filters, Collection $vehicles, Collection $parties): string
    {
        $vehicleLabel = ($filters['vehicle_id'] ?? '') !== ''
            ? 'Vehicle: '.($vehicles->firstWhere('id', (int) $filters['vehicle_id'])?->vehicle_number ?? 'All')
            : null;

        $partyLabel = ($filters['party_id'] ?? '') !== ''
            ? 'Party: '.($parties->firstWhere('id', (int) $filters['party_id'])?->name ?? 'All')
            : null;

        return ListFilter::summary([
            ($filters['search'] ?? '') !== '' ? 'Search: '.$filters['search'] : null,
            $vehicleLabel,
            $partyLabel,
            ListFilter::dateSummary($filters),
        ], 'All daily reports');
    }

    public static function nextSerialNumber(int $userId, string $reportDate): int
    {
        $max = DailyReport::query()
            ->where('user_id', $userId)
            ->whereDate('report_date', $reportDate)
            ->max('serial_number');

        return ((int) $max) + 1;
    }

    /** @return array{count: int, detention: float} */
    public static function totals(Builder $query): array
    {
        $base = (clone $query)->toBase();

        return [
            'count' => (int) (clone $base)->count(),
            'detention' => round((float) (clone $base)->sum('detention'), 2),
        ];
    }
}
