<?php

namespace App\Support;

use App\Models\Location;
use InvalidArgumentException;

class RoutePairRegistry
{
    public static function normalize(string $name): string
    {
        $trimmed = preg_replace('/\s+/', ' ', trim($name)) ?? '';

        if ($trimmed === '') {
            return '';
        }

        return mb_strtoupper($trimmed);
    }

    public static function findForUser(int $userId, string $name): ?Location
    {
        $normalized = self::normalize($name);

        if ($normalized === '') {
            return null;
        }

        return Location::query()
            ->where('user_id', $userId)
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($normalized)])
            ->first();
    }

    public static function ensureLocation(int $userId, string $name): Location
    {
        $normalized = self::normalize($name);

        if ($normalized === '') {
            throw new InvalidArgumentException('Location name is required.');
        }

        $location = self::findForUser($userId, $normalized);

        if ($location) {
            $updates = [];

            if ($location->name !== $normalized) {
                $updates['name'] = $normalized;
            }

            if (! $location->is_active) {
                $updates['is_active'] = true;
            }

            if ($updates !== []) {
                $location->update($updates);
            }

            return $location->fresh();
        }

        return Location::query()->create([
            'user_id' => $userId,
            'name' => $normalized,
            'is_active' => true,
        ]);
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
