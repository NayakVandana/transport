<?php

namespace App\Support;

class LogoValidation
{
    /** @return list<string> */
    public static function fileRule(): array
    {
        return [
            'file',
            'mimes:jpeg,jpg,png',
            'max:2048',
        ];
    }
}
