<?php

namespace App\Support;

class AmountInWords
{
    /** Indian invoice style: "FIVE THOUSAND ... AND PAISE ZERO ONLY" */
    public static function rupees(float $amount): string
    {
        $value = max(0, round($amount, 2));
        $rupees = (int) floor($value);
        $paise = (int) round(($value - $rupees) * 100);

        $words = self::indianGroupWords($rupees);
        $paiseWords = self::twoDigits($paise);

        if ($words === '') {
            $words = 'ZERO';
        }

        return strtoupper("{$words} AND PAISE {$paiseWords} ONLY");
    }

    private static function indianGroupWords(int $n): string
    {
        if ($n === 0) {
            return '';
        }

        $parts = [];
        $crore = intdiv($n, 10000000);
        $lakh = intdiv($n % 10000000, 100000);
        $thousand = intdiv($n % 100000, 1000);
        $hundred = $n % 1000;

        if ($crore > 0) {
            $parts[] = self::threeDigits($crore).' CRORE';
        }
        if ($lakh > 0) {
            $parts[] = self::threeDigits($lakh).' LAKH';
        }
        if ($thousand > 0) {
            $parts[] = self::threeDigits($thousand).' THOUSAND';
        }
        if ($hundred > 0) {
            $parts[] = self::threeDigits($hundred);
        }

        return trim(implode(' ', $parts));
    }

    private static function threeDigits(int $n): string
    {
        $h = intdiv($n, 100);
        $rest = $n % 100;
        $parts = [];

        if ($h > 0) {
            $parts[] = self::ones($h).' HUNDRED';
        }
        if ($rest > 0) {
            $parts[] = self::twoDigits($rest);
        }

        return trim(implode(' ', $parts));
    }

    private static function twoDigits(int $n): string
    {
        $ones = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN',
            'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
        $tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

        if ($n < 20) {
            return $ones[$n];
        }

        $t = intdiv($n, 10);
        $o = $n % 10;

        return trim($tens[$t].($o ? ' '.self::ones($o) : ''));
    }

    private static function ones(int $n): string
    {
        return ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'][$n] ?? '';
    }
}
