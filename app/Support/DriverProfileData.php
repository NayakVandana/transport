<?php

namespace App\Support;

class DriverProfileData
{
    /** @return array<string, mixed> */
    public static function validationRules(): array
    {
        return [
            'email' => ['nullable', 'email', 'max:255'],
            'aadhaar_no' => ['nullable', 'digits:12'],
            'pan_no' => ['nullable', 'string', 'max:20'],
            'mobiles' => ['nullable', 'array'],
            'mobiles.*' => ['nullable', 'string', 'max:15'],
            'mobile' => ['nullable', 'string', 'max:15'],
            ...AddressProfileData::validationRules(),
        ];
    }

    /** @param  array<string, mixed>  $validated */
    public static function prepareForPersistence(array $validated): array
    {
        $mobiles = PartyProfileData::normalizeMobiles(
            $validated['mobiles'] ?? null,
            $validated['mobile'] ?? null,
        );

        unset($validated['mobile']);

        $validated['mobiles'] = $mobiles === [] ? null : $mobiles;
        $validated['mobile'] = $mobiles[0] ?? null;

        return AddressProfileData::prepareForPersistence($validated);
    }
}
