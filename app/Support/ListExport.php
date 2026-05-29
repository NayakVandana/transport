<?php

namespace App\Support;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ListExport
{
    /**
     * @param  list<string>  $columnHeaders
     * @param  iterable<int, list<string|int|float|null>>  $rows
     * @param  list<string|int|float|null>|null  $footerRow
     */
    public static function csv(
        string $basename,
        string $title,
        string $filterSummary,
        array $columnHeaders,
        iterable $rows,
        ?array $footerRow = null,
    ): StreamedResponse {
        $filename = $basename.'-'.now()->format('Y-m-d-His').'.csv';

        return response()->streamDownload(function () use ($title, $filterSummary, $columnHeaders, $rows, $footerRow) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [$title]);
            fputcsv($handle, ['Filters', $filterSummary]);
            fputcsv($handle, ['Generated', now()->format('d-m-Y H:i')]);
            fputcsv($handle, []);
            fputcsv($handle, $columnHeaders);

            foreach ($rows as $row) {
                fputcsv($handle, $row);
            }

            if ($footerRow !== null) {
                fputcsv($handle, []);
                fputcsv($handle, $footerRow);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * @param  list<string>  $headers
     * @param  iterable<int, list<string>>  $rows
     * @param  list<string>|null  $footerRow
     * @param  list<array{label: string, value: string}>  $summaryLines
     */
    public static function pdf(
        string $basename,
        string $title,
        string $filterSummary,
        array $headers,
        iterable $rows,
        int $recordCount,
        ?array $footerRow = null,
        array $summaryLines = [],
    ) {
        $rowsArray = $rows instanceof Collection ? $rows->values()->all() : iterator_to_array($rows);

        $pdf = Pdf::loadView('exports.table-pdf', [
            'title' => $title,
            'filterSummary' => $filterSummary,
            'generatedAt' => now()->format('d-m-Y H:i'),
            'recordCount' => $recordCount,
            'headers' => $headers,
            'rows' => $rowsArray,
            'footerRow' => $footerRow,
            'summaryLines' => $summaryLines,
        ])->setPaper('a4', count($headers) > 6 ? 'landscape' : 'portrait');

        return $pdf->download($basename.'-'.now()->format('Y-m-d-His').'.pdf');
    }

    public static function formatMoney(float|string|null $amount): string
    {
        return number_format((float) $amount, 2, '.', ',');
    }

    public static function formatDate(mixed $date): string
    {
        if ($date === null || $date === '') {
            return '';
        }

        if ($date instanceof \DateTimeInterface) {
            return $date->format('Y-m-d');
        }

        return \Carbon\Carbon::parse((string) $date)->format('Y-m-d');
    }
}
