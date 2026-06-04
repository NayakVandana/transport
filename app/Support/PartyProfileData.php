<?php

namespace App\Support;

class PartyProfileData
{
    /** @return list<string> */
    public static function normalizeMobiles(mixed $mobiles, ?string $legacyMobile = null): array
    {
        $values = [];

        if (is_array($mobiles)) {
            $values = $mobiles;
        } elseif (is_string($mobiles) && $mobiles !== '') {
            $values = [$mobiles];
        }

        if ($values === [] && $legacyMobile !== null && trim($legacyMobile) !== '') {
            $values = [$legacyMobile];
        }

        $normalized = [];

        foreach ($values as $value) {
            $mobile = trim((string) $value);

            if ($mobile === '') {
                continue;
            }

            $normalized[] = $mobile;
        }

        return array_values(array_unique($normalized));
    }

    /** @param  array<string, mixed>  $data */
    public static function buildInvoiceAddress(array $data): ?string
    {
        return AddressProfileData::buildFormattedAddress($data);
    }

    /** @param  array<string, mixed>  $validated */
    public static function prepareForPersistence(array $validated): array
    {
        $mobiles = self::normalizeMobiles(
            $validated['mobiles'] ?? null,
            $validated['mobile'] ?? null,
        );

        unset($validated['mobile']);

        $validated['mobiles'] = $mobiles === [] ? null : $mobiles;
        $validated['mobile'] = $mobiles[0] ?? null;

        return AddressProfileData::prepareForPersistence($validated);
    }
}
