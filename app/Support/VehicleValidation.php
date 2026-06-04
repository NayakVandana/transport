<?php

namespace App\Support;

class VehicleValidation
{
    /** @return array<string, string> */
    public static function fieldLabels(): array
    {
        /** @var array<string, string> $fields */
        $fields = __('vehicle.fields');

        return $fields;
    }

    /** @return array<string, array<string, string>> */
    public static function customMessages(): array
    {
        /** @var array<string, array<string, string>> $messages */
        $messages = __('vehicle.messages');

        return $messages;
    }

    /**
     * Flat messages array for Laravel FormRequest validation.
     *
     * @return array<string, string>
     */
    public static function requestMessages(): array
    {
        $messages = [];

        foreach (self::customMessages() as $field => $rules) {
            foreach ($rules as $rule => $message) {
                $messages["{$field}.{$rule}"] = $message;
            }
        }

        return $messages;
    }

    /**
     * Custom messages for the frontend (same source as backend).
     *
     * @return array<string, array<string, string>>
     */
    public static function forFrontend(): array
    {
        return self::customMessages();
    }

    /** @return list<string> */
    public static function fuelTypes(): array
    {
        /** @var list<string> $types */
        $types = __('vehicle.fuel_types');

        return $types;
    }

    /** @return list<string> */
    public static function taxNames(): array
    {
        /** @var list<string> $names */
        $names = __('vehicle.tax_names');

        return $names;
    }
}
