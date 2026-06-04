<?php

namespace App\Support;

use App\Models\FreightInvoice;
use App\Models\Entrybook;
use App\Models\InvoicePayment;
use App\Models\Party;
use Illuminate\Http\Request;

class PartyAccountReport
{
    /**
     * @return array{
     *     party: Party,
     *     overview: array{
     *         invoice_count: int,
     *         balance_due: float,
     *         received: float,
     *         outstanding: float,
     *         last_invoice_date: ?string,
     *         last_payment_date: ?string
     *     },
     *     invoices: list<array{
     *         id: int,
     *         bill_number: string,
     *         invoice_date: string,
     *         status: string,
     *         net_value: float,
     *         balance_amount: float,
     *         received: float,
     *         outstanding: float
     *     }>,
     *     payments: list<array{
     *         id: int,
     *         payment_date: string,
     *         amount: float,
     *         payment_mode: ?string,
     *         reference_no: ?string,
     *         notes: ?string,
     *         freight_invoice_id: int,
     *         bill_number: string
     *     }>,
     *     ledger: list<array{
     *         date: string,
     *         type: string,
     *         reference: string,
     *         bill_number: string,
     *         particulars: string,
     *         debit: float,
     *         credit: float,
     *         balance: float,
     *         invoice_id: ?int,
     *         payment_id: ?int
     *     }>,
     *     filters: array<string, string>,
     *     filterSummary: string
     * }
     */
    public static function build(int $userId, int $partyId, Request $request): array
    {
        $party = Party::query()
            ->where('user_id', $userId)
            ->findOrFail($partyId);

        $dateFilters = ListFilter::dateFromRequest($request);
        $filterSummary = ListFilter::summary([
            ListFilter::dateSummary($dateFilters),
        ], 'All transactions');

        $invoices = FreightInvoice::query()
            ->where('user_id', $userId)
            ->where('party_id', $partyId)
            ->orderByDesc('invoice_date')
            ->orderByDesc('id')
            ->get();

        $paymentsQuery = InvoicePayment::query()
            ->with(['freightInvoice:id,bill_number'])
            ->where('user_id', $userId)
            ->where('party_id', $partyId)
            ->orderByDesc('payment_date')
            ->orderByDesc('id');

        ListFilter::applyDate($paymentsQuery, $dateFilters, 'payment_date');

        $payments = $paymentsQuery->get();

        $invoiceRows = [];
        $lastInvoiceDate = null;

        foreach ($invoices as $invoice) {
            $summary = InvoicePaymentCalculator::invoiceSummary($invoice);

            if ($lastInvoiceDate === null || $invoice->invoice_date > $lastInvoiceDate) {
                $lastInvoiceDate = $invoice->invoice_date->format('Y-m-d');
            }

            $invoiceRows[] = [
                'id' => $invoice->id,
                'bill_number' => $invoice->bill_number,
                'invoice_date' => $invoice->invoice_date->format('Y-m-d'),
                'status' => $invoice->status,
                'net_value' => round((float) $invoice->net_value, 2),
                'balance_amount' => round((float) $invoice->balance_amount, 2),
                'received' => $summary['received'],
                'outstanding' => $summary['outstanding'],
                'payment_status' => $summary['payment_status'],
            ];
        }

        $partyTotals = InvoicePaymentCalculator::partySummary($userId, $partyId);

        $paymentRows = $payments->map(fn (InvoicePayment $payment) => [
            'id' => $payment->id,
            'payment_date' => $payment->payment_date->format('Y-m-d'),
            'amount' => round((float) $payment->amount, 2),
            'payment_mode' => $payment->payment_mode,
            'reference_no' => $payment->reference_no,
            'notes' => $payment->notes,
            'freight_invoice_id' => $payment->freight_invoice_id,
            'bill_number' => $payment->bill_number ?? $payment->freightInvoice?->bill_number ?? '',
        ])->values()->all();

        $lastPaymentDate = $payments->first()?->payment_date?->format('Y-m-d');

        $ledger = self::buildLedger($invoices, $payments, $dateFilters);

        $entrybookRows = Entrybook::query()
            ->with(['vehicle:id,vehicle_number', 'invoiceLine.freightInvoice:id,bill_number'])
            ->where('user_id', $userId)
            ->where('party_id', $partyId)
            ->orderByDesc('entry_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Entrybook $entry) => [
                'id' => $entry->id,
                'entry_number' => $entry->entry_number,
                'entry_date' => $entry->entry_date->format('Y-m-d'),
                'vehicle_number' => $entry->vehicle?->vehicle_number ?? '',
                'route_from' => $entry->route_from ?? '',
                'route_to' => $entry->route_to ?? '',
                'freight' => round((float) $entry->freight, 2),
                'advance' => round((float) $entry->advance, 2),
                'balance' => round((float) $entry->balance, 2),
                'invoice_id' => $entry->invoiceLine?->freight_invoice_id,
                'bill_number' => $entry->invoiceLine?->freightInvoice?->bill_number,
            ])
            ->values()
            ->all();

        return [
            'party' => $party,
            'overview' => [
                'invoice_count' => count($invoiceRows),
                'entry_count' => count($entrybookRows),
                'balance_due' => $partyTotals['balance_due'],
                'received' => $partyTotals['received'],
                'outstanding' => $partyTotals['outstanding'],
                'last_invoice_date' => $lastInvoiceDate,
                'last_payment_date' => $lastPaymentDate,
            ],
            'invoices' => $invoiceRows,
            'entrybooks' => $entrybookRows,
            'payments' => $paymentRows,
            'ledger' => $ledger,
            'filters' => $dateFilters,
            'filterSummary' => $filterSummary,
        ];
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Collection<int, FreightInvoice>  $invoices
     * @param  \Illuminate\Database\Eloquent\Collection<int, InvoicePayment>  $payments
     * @param  array<string, string>  $dateFilters
     * @return list<array{
     *     date: string,
     *     type: string,
     *     reference: string,
     *     particulars: string,
     *     debit: float,
     *     credit: float,
     *     balance: float,
     *     invoice_id: ?int,
     *     payment_id: ?int
     * }>
     */
    private static function buildLedger($invoices, $payments, array $dateFilters): array
    {
        $entries = [];

        foreach ($invoices as $invoice) {
            $date = $invoice->invoice_date->format('Y-m-d');

            if (! self::dateInFilter($date, $dateFilters)) {
                continue;
            }

            $entries[] = [
                'date' => $date,
                'type' => 'invoice',
                'reference' => $invoice->bill_number,
                'bill_number' => $invoice->bill_number,
                'particulars' => 'Tax Invoice',
                'debit' => round((float) $invoice->balance_amount, 2),
                'credit' => 0.0,
                'balance' => 0.0,
                'invoice_id' => $invoice->id,
                'payment_id' => null,
                'sort_key' => $date.'-0-'.str_pad((string) $invoice->id, 8, '0', STR_PAD_LEFT),
            ];
        }

        foreach ($payments as $payment) {
            $date = $payment->payment_date->format('Y-m-d');

            if (! self::dateInFilter($date, $dateFilters)) {
                continue;
            }

            $billNumber = $payment->bill_number ?: ($payment->freightInvoice?->bill_number ?? '');
            $reference = $payment->reference_no ?? '';
            $mode = $payment->payment_mode ? strtoupper($payment->payment_mode) : 'Payment';

            $entries[] = [
                'date' => $date,
                'type' => 'payment',
                'reference' => $reference,
                'bill_number' => $billNumber,
                'particulars' => "Received — {$mode}",
                'debit' => 0.0,
                'credit' => round((float) $payment->amount, 2),
                'balance' => 0.0,
                'invoice_id' => $payment->freight_invoice_id,
                'payment_id' => $payment->id,
                'sort_key' => $date.'-1-'.str_pad((string) $payment->id, 8, '0', STR_PAD_LEFT),
            ];
        }

        usort($entries, fn (array $a, array $b) => strcmp($a['sort_key'], $b['sort_key']));

        $running = 0.0;
        $ledger = [];

        foreach ($entries as $entry) {
            unset($entry['sort_key']);
            $running += $entry['debit'] - $entry['credit'];
            $entry['balance'] = round(max(0, $running), 2);
            $ledger[] = $entry;
        }

        return array_reverse($ledger);
    }

    /** @param  array<string, string>  $dateFilters */
    private static function dateInFilter(string $date, array $dateFilters): bool
    {
        $from = $dateFilters['date_from'] ?? '';
        $to = $dateFilters['date_to'] ?? '';

        if ($from !== '' && $date < $from) {
            return false;
        }

        if ($to !== '' && $date > $to) {
            return false;
        }

        return true;
    }
}
