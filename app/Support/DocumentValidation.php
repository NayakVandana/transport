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

    /** @return list<string> */
    public static function userDocumentTypes(): array
    {
        return ['aadhaar', 'pan', 'photo', 'address_proof', 'id_proof', 'other'];
    }

    /** @return list<string> */
    public static function companyDocumentTypes(): array
    {
        return ['gst_certificate', 'pan_card', 'udyam_certificate', 'bank_proof', 'signature', 'other'];
    }

    /** @return list<string> */
    public static function partyDocumentTypes(): array
    {
        return ['gst_certificate', 'pan_card', 'agreement', 'address_proof', 'photo', 'other'];
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

    /** @return array<string, string> */
    public static function userDocumentTypeLabels(): array
    {
        return [
            'aadhaar' => 'Aadhaar',
            'pan' => 'PAN Card',
            'photo' => 'Photo',
            'address_proof' => 'Address Proof',
            'id_proof' => 'ID Proof',
            'other' => 'Other',
        ];
    }

    /** @return array<string, string> */
    public static function companyDocumentTypeLabels(): array
    {
        return [
            'gst_certificate' => 'GST Certificate',
            'pan_card' => 'PAN Card',
            'udyam_certificate' => 'Udyam Certificate',
            'bank_proof' => 'Bank Proof',
            'signature' => 'Signature',
            'other' => 'Other',
        ];
    }

    /** @return array<string, string> */
    public static function partyDocumentTypeLabels(): array
    {
        return [
            'gst_certificate' => 'GST Certificate',
            'pan_card' => 'PAN Card',
            'agreement' => 'Agreement / Contract',
            'address_proof' => 'Address Proof',
            'photo' => 'Photo',
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

    /** @return list<array{value: string, label: string}> */
    public static function userOptionsForFrontend(): array
    {
        $options = [];
        foreach (self::userDocumentTypeLabels() as $value => $label) {
            $options[] = ['value' => $value, 'label' => $label];
        }

        return $options;
    }

    /** @return list<array{value: string, label: string}> */
    public static function companyOptionsForFrontend(): array
    {
        $options = [];
        foreach (self::companyDocumentTypeLabels() as $value => $label) {
            $options[] = ['value' => $value, 'label' => $label];
        }

        return $options;
    }

    /** @return list<array{value: string, label: string}> */
    public static function partyOptionsForFrontend(): array
    {
        $options = [];
        foreach (self::partyDocumentTypeLabels() as $value => $label) {
            $options[] = ['value' => $value, 'label' => $label];
        }

        return $options;
    }

    /** @return list<string> */
    public static function allowedMimeExtensions(): array
    {
        return ['jpeg', 'jpg', 'png', 'pdf'];
    }

    /** @return list<string> */
    public static function fileRule(): array
    {
        return [
            'file',
            'mimes:'.implode(',', self::allowedMimeExtensions()),
            'max:5120',
        ];
    }
}
