<?php

namespace App\Support;

use App\Models\Location;
use InvalidArgumentException;

class RoutePairRegistry
{
    public static function normalize(string $name): string
    {
        return preg_replace('/\s+/', ' ', trim($name)) ?? '';
    }

    public static function ensureLocation(int $userId, string $name): Location
    {
        $normalized = self::normalize($name);

        if ($normalized === '') {
            throw new InvalidArgumentException('Location name is required.');
        }

        $location = Location::query()->firstOrCreate(
            ['user_id' => $userId, 'name' => $normalized],
            ['is_active' => true],
        );

        if (! $location->is_active) {
            $location->update(['is_active' => true]);
        }

        return $location;
    }

    /** @return array{from: string, to: string} */
    public static function validatedPair(string $from, string $to): array
    {
        $fromNorm = self::normalize($from);
        $toNorm = self::normalize($to);

        if ($fromNorm === '' || $toNorm === '') {
            throw new InvalidArgumentException('From and to locations are required.');
        }

        if (strcasecmp($fromNorm, $toNorm) === 0) {
            throw new InvalidArgumentException('From and to locations must be different.');
        }

        return ['from' => $fromNorm, 'to' => $toNorm];
    }

    /** @return array{from: string, to: string} */
    public static function registerTripLocations(int $userId, string $from, string $to): array
    {
        $pair = self::validatedPair($from, $to);
        self::ensureLocation($userId, $pair['from']);
        self::ensureLocation($userId, $pair['to']);

        return $pair;
    }

    public static function formatLabel(?string $from, ?string $to): string
    {
        $fromValue = trim((string) $from);
        $toValue = trim((string) $to);

        if ($fromValue === '' && $toValue === '') {
            return '—';
        }

        $fromLabel = $fromValue !== '' ? $fromValue : '—';
        $toLabel = $toValue !== '' ? $toValue : '—';

        return "{$fromLabel} → {$toLabel}";
    }
}
