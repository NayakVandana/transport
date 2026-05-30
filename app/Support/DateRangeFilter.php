<?php

namespace App\Support;

use Carbon\Carbon;

class DateRangeFilter
{
    /** @var list<string> */
    public const PRESETS = [
        'today',
        'yesterday',
        'last_7_days',
        'last_30_days',
        'this_month',
        'last_month',
        'all',
        'custom',
    ];

    /**
     * @return array{0: string, 1: string}
     */
    public static function resolveDates(string $dateRange, string $dateFrom = '', string $dateTo = ''): array
    {
        $today = Carbon::today();

        return match ($dateRange) {
            'today' => [$today->toDateString(), $today->toDateString()],
            'yesterday' => [
                $today->copy()->subDay()->toDateString(),
                $today->copy()->subDay()->toDateString(),
            ],
            'last_7_days' => [
                $today->copy()->subDays(6)->toDateString(),
                $today->toDateString(),
            ],
            'last_30_days' => [
                $today->copy()->subDays(29)->toDateString(),
                $today->toDateString(),
            ],
            'this_month' => [
                $today->copy()->startOfMonth()->toDateString(),
                $today->copy()->endOfMonth()->toDateString(),
            ],
            'last_month' => [
                $today->copy()->subMonth()->startOfMonth()->toDateString(),
                $today->copy()->subMonth()->endOfMonth()->toDateString(),
            ],
            'custom' => self::normalizeCustomRange($dateFrom, $dateTo),
            default => ['', ''],
        };
    }

    public static function label(string $dateRange): string
    {
        return match ($dateRange) {
            'today' => 'Today',
            'yesterday' => 'Yesterday',
            'last_7_days' => 'Last 7 days',
            'last_30_days' => 'Last 30 days',
            'this_month' => 'This Month',
            'last_month' => 'Last Month',
            'custom' => 'Custom',
            default => 'All',
        };
    }

    public static function normalizeRange(?string $dateRange, string $dateFrom = '', string $dateTo = ''): string
    {
        if ($dateRange && in_array($dateRange, self::PRESETS, true)) {
            return $dateRange;
        }

        if ($dateFrom !== '' || $dateTo !== '') {
            return 'custom';
        }

        return 'all';
    }

    /** @return array{0: string, 1: string} */
    private static function normalizeCustomRange(string $dateFrom, string $dateTo): array
    {
        if ($dateFrom && $dateTo && $dateFrom > $dateTo) {
            [$dateFrom, $dateTo] = [$dateTo, $dateFrom];
        }

        return [$dateFrom, $dateTo];
    }
}
