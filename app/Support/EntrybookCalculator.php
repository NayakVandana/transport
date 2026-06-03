<?php

namespace App\Support;

class EntrybookCalculator
{
    public static function balance(float $freight, float $advance, float $detention = 0): float
    {
        return round($freight + $detention - $advance, 2);
    }
}
