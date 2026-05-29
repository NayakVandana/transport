<?php

namespace App\Support;

class DocumentValidation
{
    /** @return list<string> */
    public static function vehicleDocumentTypes(): array
    {
        return ['insurance', 'permit', 'fitness', 'pollution', 'rc', 'puc', 'other'];
    }

    /** @return list<string> */
    public static function driverDocumentTypes(): array
    {
        return ['license', 'aadhaar', 'photo', 'address_proof', 'medical', 'other'];
    }

    /** @return array<string, string> */
    public static function vehicleDocumentTypeLabels(): array
    {
        return [
            'insurance' => 'Insurance',
            'permit' => 'Permit',
            'fitness' => 'Fitness Certificate',
            'pollution' => 'Pollution Certificate',
            'rc' => 'Registration (RC)',
            'puc' => 'PUC',
            'other' => 'Other',
        ];
    }

    /** @return array<string, string> */
    public static function driverDocumentTypeLabels(): array
    {
        return [
            'license' => 'Driving License',
            'aadhaar' => 'Aadhaar',
            'photo' => 'Photo',
            'address_proof' => 'Address Proof',
            'medical' => 'Medical Certificate',
            'other' => 'Other',
        ];
    }

    /** @return list<array{value: string, label: string}> */
    public static function vehicleOptionsForFrontend(): array
    {
        $options = [];
        foreach (self::vehicleDocumentTypeLabels() as $value => $label) {
            $options[] = ['value' => $value, 'label' => $label];
        }

        return $options;
    }

    /** @return list<array{value: string, label: string}> */
    public static function driverOptionsForFrontend(): array
    {
        $options = [];
        foreach (self::driverDocumentTypeLabels() as $value => $label) {
            $options[] = ['value' => $value, 'label' => $label];
        }

        return $options;
    }

    /** @return list<string> */
    public static function allowedMimeExtensions(): array
    {
        return ['jpeg', 'jpg', 'png', 'pdf'];
    }

    public static function fileRule(): string
    {
        return 'file|mimes:'.implode(',', self::allowedMimeExtensions()).'|max:5120';
    }
}
