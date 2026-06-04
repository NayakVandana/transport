<?php

namespace App\Support;

use App\Models\LoadingSlip;
use Barryvdh\DomPDF\Facade\Pdf;

class LoadingSlipPdf
{
    public static function download(LoadingSlip $slip, ?string $contactEmail = null, ?\App\Models\Company $company = null)
    {
        $pdf = Pdf::loadView('loading-slips.loading-slip-pdf', [
            'slip' => $slip,
            'company' => $company,
            'party' => $slip->party,
            'lines' => $slip->lines,
            'contactEmail' => $contactEmail,
        ])
            ->setPaper('a4', 'portrait')
            ->setOption('defaultFont', 'DejaVu Sans')
            ->setOption('isHtml5ParserEnabled', true);

        $date = $slip->slip_date?->format('Y-m-d') ?? 'slip';
        $filename = 'loading-slip-'.$date.'.pdf';

        return $pdf->download($filename);
    }
}
