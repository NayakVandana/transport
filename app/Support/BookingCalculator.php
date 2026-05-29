<?php

namespace App\Support;

class BookingCalculator
{
    public static function balance(
        float $freight,
        float $advance,
        float $emptyCharge,
        float $maintenance,
    ): float {
        return round($freight + $emptyCharge - $advance - $maintenance, 2);
    }
}
