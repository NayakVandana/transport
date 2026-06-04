<?php

namespace App\Support;

class EntrybookCalculator
{
    public static function balance(float $freight, float $advance): float
    {
        return round($freight - $advance, 2);
    }
}
