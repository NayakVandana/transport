<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ListFilter
{
    /** @return array{date_range: string, date_from: string, date_to: string} */
    public static function dateFromRequest(Request $request): array
    {
        $validated = $request->validate([
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

        return [
            'date_range' => $dateRange,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
        ];
    }

    public static function searchFromRequest(Request $request): string
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        return trim($validated['search'] ?? '');
    }

    /** @param  list<string>  $allowed */
    public static function statusFromRequest(Request $request, array $allowed): string
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', Rule::in($allowed)],
        ]);

        return $validated['status'] ?? '';
    }

    public static function optionalIdFromRequest(Request $request, string $key): string
    {
        $validated = $request->validate([
            $key => ['nullable', 'integer'],
        ]);

        return isset($validated[$key]) ? (string) $validated[$key] : '';
    }

    /** @param  array{date_range: string, date_from: string, date_to: string}  $filters */
    public static function applyDate(Builder $query, array $filters, string $column): Builder
    {
        return $query
            ->when($filters['date_from'], fn ($builder, $dateFrom) => $builder->whereDate($column, '>=', $dateFrom))
            ->when($filters['date_to'], fn ($builder, $dateTo) => $builder->whereDate($column, '<=', $dateTo));
    }

    /** @param  list<string>  $columns */
    public static function applySearch(Builder $query, string $search, array $columns): Builder
    {
        if ($search === '') {
            return $query;
        }

        return $query->where(function (Builder $builder) use ($search, $columns) {
            foreach ($columns as $column) {
                $builder->orWhere($column, 'like', "%{$search}%");
            }
        });
    }

    /** @param  array{date_range: string, date_from: string, date_to: string}  $dateFilters */
    public static function dateSummary(array $dateFilters): ?string
    {
        $dateRange = $dateFilters['date_range'] ?? 'all';

        if ($dateRange === 'custom') {
            $parts = [];
            if ($dateFilters['date_from']) {
                $parts[] = 'From: '.$dateFilters['date_from'];
            }
            if ($dateFilters['date_to']) {
                $parts[] = 'To: '.$dateFilters['date_to'];
            }

            return $parts === [] ? null : implode(' | ', $parts);
        }

        if ($dateRange !== 'all') {
            return 'Period: '.BookingDateFilter::label($dateRange);
        }

        return null;
    }

    /** @param  list<string|null>  $parts */
    public static function summary(array $parts, string $default = 'All records'): string
    {
        $filtered = array_values(array_filter($parts));

        return $filtered === [] ? $default : implode(' | ', $filtered);
    }
}
