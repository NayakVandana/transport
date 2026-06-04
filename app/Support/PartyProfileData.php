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
        $lines = [];

        $fullAddress = trim((string) ($data['full_address'] ?? ''));
        if ($fullAddress !== '') {
            $lines = array_merge($lines, preg_split("/\r\n|\r|\n/", $fullAddress) ?: []);
        }

        $locality = array_filter([
            trim((string) ($data['city'] ?? '')),
            trim((string) ($data['taluka'] ?? '')),
            trim((string) ($data['district'] ?? '')),
        ]);

        if ($locality !== []) {
            $lines[] = implode(', ', $locality);
        }

        $pincode = trim((string) ($data['pincode'] ?? ''));
        if ($pincode !== '') {
            $lines[] = 'PIN: '.$pincode;
        }

        $stateCode = trim((string) ($data['state_code'] ?? ''));
        if ($stateCode !== '') {
            $lines[] = 'State Code: '.$stateCode;
        }

        $country = trim((string) ($data['country'] ?? ''));
        if ($country !== '') {
            $lines[] = $country;
        }

        $lines = array_values(array_filter(array_map(
            fn (string $line) => trim($line),
            $lines,
        ), fn (string $line) => $line !== ''));

        if ($lines === []) {
            $legacyAddress = trim((string) ($data['address'] ?? ''));

            return $legacyAddress !== '' ? $legacyAddress : null;
        }

        return implode("\n", $lines);
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
        $validated['address'] = self::buildInvoiceAddress($validated);

        return $validated;
    }
}
