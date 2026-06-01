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
            fputcsv($handle, ['Generated', ListExport::formatDate(now())]);
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
            'generatedAt' => ListExport::formatDate(now()),
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

    public static function formatCreatedAt(mixed $date): string
    {
        if ($date === null || $date === '') {
            return '';
        }

        $carbon = $date instanceof \DateTimeInterface
            ? \Carbon\Carbon::instance($date)
            : \Carbon\Carbon::parse((string) $date);

        return $carbon->format('j M, Y').' | '.$carbon->format('g:i A');
    }

    public static function formatDate(mixed $date): string
    {
        if ($date === null || $date === '') {
            return '';
        }

        $carbon = $date instanceof \DateTimeInterface
            ? \Carbon\Carbon::instance($date)
            : \Carbon\Carbon::parse((string) $date);

        $datePart = $carbon->format('j M, Y');

        if ($carbon->format('H:i:s') === '00:00:00') {
            return $datePart;
        }

        return $datePart.' | '.$carbon->format('g:i A');
    }
}
