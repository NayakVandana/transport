<?php

namespace App\Support;

class VehicleExpenseValidation
{
    /** @return array<string, array<string, string>> */
    public static function customMessages(): array
    {
        /** @var array<string, array<string, string>> $messages */
        $messages = __('vehicle_expense.messages');

        return $messages;
    }

    /** @return array<string, string> */
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

    /** @return array<string, array<string, string>> */
    public static function forFrontend(): array
    {
        return self::customMessages();
    }
}
