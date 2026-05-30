<?php

namespace App\Support;

class VehicleExpenseCalculator
{
    public static function balance(
        float $freight,
        float $advance,
        float $emptyCharge,
        float $toll,
        float $maintenance,
    ): float {
        return round($freight + $emptyCharge - $advance - $toll - $maintenance, 2);
    }
}
