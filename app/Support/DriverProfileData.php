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
            'show_photo' => ['nullable', 'boolean'],
            'show_email' => ['nullable', 'boolean'],
            'show_address' => ['nullable', 'boolean'],
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

        $validated['show_photo'] = array_key_exists('show_photo', $validated)
            ? (bool) $validated['show_photo']
            : true;
        $validated['show_email'] = array_key_exists('show_email', $validated)
            ? (bool) $validated['show_email']
            : true;
        $validated['show_address'] = array_key_exists('show_address', $validated)
            ? (bool) $validated['show_address']
            : true;

        return AddressProfileData::prepareForPersistence($validated);
    }
}
