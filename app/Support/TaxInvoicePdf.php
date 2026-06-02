<?php

namespace App\Support;

use App\Models\FreightInvoice;
use App\Models\FreightInvoiceLine;
use Barryvdh\DomPDF\Facade\Pdf;

class TaxInvoicePdf
{
    public static function lineFreight(FreightInvoiceLine $line): float
    {
        if ($line->freight !== null) {
            return (float) $line->freight;
        }

        return round((float) $line->weight * (float) $line->rate, 2);
    }

    public static function download(FreightInvoice $invoice)
    {
        $pdf = Pdf::loadView('invoices.tax-invoice-pdf', [
            'invoice' => $invoice,
            'company' => $invoice->company,
            'party' => $invoice->party,
            'lines' => $invoice->lines,
        ])
            ->setPaper('a4', 'portrait')
            ->setOption('defaultFont', 'DejaVu Sans')
            ->setOption('isHtml5ParserEnabled', true);

        $filename = preg_replace('/[^\w\-]+/', '-', (string) $invoice->bill_number).'.pdf';

        return $pdf->download($filename);
    }
}
