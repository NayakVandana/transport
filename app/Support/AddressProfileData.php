<?php

namespace App\Support;

class AddressProfileData
{
    public const DEFAULT_COUNTRY = 'India';

    /** @return array<string, mixed> */
    public static function validationRules(): array
    {
        return [
            'full_address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'taluka' => ['nullable', 'string', 'max:100'],
            'district' => ['nullable', 'string', 'max:100'],
            'pincode' => ['nullable', 'string', 'max:10'],
            'state_code' => ['nullable', 'string', 'max:5'],
            'country' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string'],
        ];
    }

    /** @param  array<string, mixed>  $data */
    public static function buildFormattedAddress(array $data): ?string
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

        $country = self::normalizeCountry($data['country'] ?? null);
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

    public static function normalizeCountry(mixed $country): string
    {
        $trimmed = trim((string) $country);

        return $trimmed !== '' ? $trimmed : self::DEFAULT_COUNTRY;
    }

    /** @param  array<string, mixed>  $validated */
    public static function prepareForPersistence(array $validated): array
    {
        $validated['country'] = self::normalizeCountry($validated['country'] ?? null);
        $validated['address'] = self::buildFormattedAddress($validated);

        return $validated;
    }
}
