<?php

namespace App\Support;

class BookingValidation
{
    /** @return array<string, array<string, string>> */
    public static function customMessages(): array
    {
        /** @var array<string, array<string, string>> $messages */
        $messages = __('booking.messages');

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
