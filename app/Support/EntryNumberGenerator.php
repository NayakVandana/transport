<?php

namespace App\Support;

use App\Models\Company;
use App\Models\Entrybook;
use App\Models\FreightInvoiceLine;

class EntryNumberGenerator
{
    public static function format(Company $company, int $sequence): string
    {
        return sprintf('%s-%d', $company->entry_number_prefix, $sequence);
    }

    public static function formatEntrybookNumber(int $sequence): string
    {
        return sprintf('%03d', $sequence);
    }

    public static function resolveEntrybookSequence(int $userId): int
    {
        $max = Entrybook::query()
            ->where('user_id', $userId)
            ->pluck('entry_number')
            ->map(fn (string $no) => self::sequenceFromEntrybookNumber($no))
            ->filter()
            ->max();

        return ($max ?? 0) + 1;
    }

    public static function sequenceFromEntrybookNumber(string $entryNumber): ?int
    {
        if (preg_match('/^\d+$/', $entryNumber)) {
            return (int) $entryNumber;
        }

        if (preg_match('/-(\d+)$/', $entryNumber, $matches)) {
            return (int) $matches[1];
        }

        return null;
    }

    /** @return list<string> */
    public static function suggestNext(Company $company, int $count = 1): array
    {
        $start = self::resolveNextSequence($company);
        $numbers = [];

        for ($i = 0; $i < $count; $i++) {
            $numbers[] = self::format($company, $start + $i);
        }

        return $numbers;
    }

    public static function resolveNextSequence(Company $company): int
    {
        $prefix = $company->entry_number_prefix;
        $pattern = $prefix.'-%';

        $maxFromLines = FreightInvoiceLine::query()
            ->whereHas('freightInvoice', fn ($q) => $q->where('company_id', $company->id))
            ->where('entry_number', 'like', $pattern)
            ->pluck('entry_number')
            ->map(fn (string $no) => self::sequenceFromNumber($no, $prefix))
            ->filter()
            ->max();

        $stored = (int) $company->entry_next_sequence;

        return max($stored, $maxFromLines ? $maxFromLines + 1 : $stored);
    }

    public static function syncCompanySequence(Company $company, array $entryNumbers): void
    {
        $prefix = $company->entry_number_prefix;
        $max = (int) $company->entry_next_sequence;

        foreach ($entryNumbers as $number) {
            $seq = self::sequenceFromNumber((string) $number, $prefix);
            if ($seq !== null) {
                $max = max($max, $seq + 1);
            }
        }

        if ($max > (int) $company->entry_next_sequence) {
            $company->update(['entry_next_sequence' => $max]);
        }
    }

    public static function sequenceFromNumber(string $entryNumber, string $prefix): ?int
    {
        $escaped = preg_quote($prefix, '/');
        if (preg_match('/^'.$escaped.'-(\d+)$/', $entryNumber, $m)) {
            return (int) $m[1];
        }

        return null;
    }
}
