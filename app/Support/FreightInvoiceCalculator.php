<?php

namespace App\Support;

class FreightInvoiceCalculator
{
    /**
     * @param  list<array{weight: float|int|string, rate: float|int|string, advance_paid?: float|int|string, empty_container_charge?: float|int|string}>  $lines
     * @return array{
     *     total_weight: float,
     *     total_freight: float,
     *     total_empty_container_charge: float,
     *     net_value: float,
     *     total_advance: float,
     *     balance_amount: float,
     *     gross_freight: float,
     *     igst_amount: float,
     *     line_freights: list<float>
     * }
     */
    public static function calculate(array $lines, float $igstRate = 5): array
    {
        $totalWeight = 0.0;
        $totalFreight = 0.0;
        $totalEmptyContainer = 0.0;
        $totalAdvance = 0.0;
        $lineFreights = [];

        foreach ($lines as $line) {
            $weight = (float) ($line['weight'] ?? 1);
            $rate = (float) ($line['rate'] ?? 0);
            $freight = round($weight * $rate, 2);
            $advance = (float) ($line['advance_paid'] ?? 0);
            $emptyCharge = (float) ($line['empty_container_charge'] ?? 0);

            $lineFreights[] = $freight;
            $totalWeight += $weight;
            $totalFreight += $freight;
            $totalEmptyContainer += $emptyCharge;
            $totalAdvance += $advance;
        }

        $netValue = round($totalFreight + $totalEmptyContainer, 2);
        $balance = round($netValue - $totalAdvance, 2);
        $grossFreight = $netValue;
        $igstAmount = round($grossFreight * ($igstRate / 100), 2);

        return [
            'total_weight' => round($totalWeight, 3),
            'total_freight' => round($totalFreight, 2),
            'total_empty_container_charge' => round($totalEmptyContainer, 2),
            'net_value' => $netValue,
            'total_advance' => round($totalAdvance, 2),
            'balance_amount' => $balance,
            'gross_freight' => $grossFreight,
            'igst_amount' => $igstAmount,
            'line_freights' => $lineFreights,
        ];
    }

    /**
     * @param  list<array{weight: float|int|string, rate: float|int|string, advance_paid?: float|int|string, empty_container_charge?: float|int|string}>  $lines
     * @return array{0: array<string, float>, 1: list<float>}
     */
    public static function forPersistence(array $lines, float $igstRate = 5): array
    {
        $result = self::calculate($lines, $igstRate);
        $lineFreights = $result['line_freights'];
        unset($result['line_freights']);

        return [$result, $lineFreights];
    }
}
