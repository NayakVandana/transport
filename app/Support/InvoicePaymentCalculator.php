<?php

namespace App\Support;

use App\Models\FreightInvoice;
use App\Models\InvoicePayment;
use App\Models\Party;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

class InvoicePaymentCalculator
{
    public static function receivedAmount(FreightInvoice|int $invoice, ?int $excludePaymentId = null): float
    {
        $invoiceId = $invoice instanceof FreightInvoice ? $invoice->id : $invoice;

        $query = InvoicePayment::query()->where('freight_invoice_id', $invoiceId);

        if ($excludePaymentId !== null) {
            $query->where('id', '!=', $excludePaymentId);
        }

        return round((float) $query->sum('amount'), 2);
    }

    public static function outstanding(FreightInvoice $invoice, ?int $excludePaymentId = null): float
    {
        $due = (float) $invoice->balance_amount - self::receivedAmount($invoice, $excludePaymentId);

        return max(0, round($due, 2));
    }

    /** @return array{received: float, outstanding: float, payment_status: string} */
    public static function invoiceSummary(FreightInvoice $invoice, ?int $excludePaymentId = null): array
    {
        $received = self::receivedAmount($invoice, $excludePaymentId);
        $outstanding = max(0, round((float) $invoice->balance_amount - $received, 2));

        return [
            'received' => $received,
            'outstanding' => $outstanding,
            'payment_status' => self::paymentStatus((float) $invoice->balance_amount, $received, $outstanding),
        ];
    }

    public static function paymentStatus(float $balanceAmount, float $received, float $outstanding): string
    {
        if ($outstanding <= 0) {
            return 'paid';
        }

        if ($received > 0) {
            return 'partial';
        }

        return 'pending';
    }

    /** @param  \Illuminate\Database\Eloquent\Builder<\App\Models\FreightInvoice>  $query */
    public static function applyPaymentStatusFilter($query, string $paymentStatus): void
    {
        if ($paymentStatus === '') {
            return;
        }

        $receivedSubquery = '(SELECT COALESCE(SUM(amount), 0) FROM invoice_payments WHERE freight_invoice_id = freight_invoices.id AND deleted_at IS NULL)';

        match ($paymentStatus) {
            'paid' => $query->whereRaw("{$receivedSubquery} >= freight_invoices.balance_amount"),
            'pending' => $query->whereRaw("{$receivedSubquery} = 0")->where('balance_amount', '>', 0),
            'partial' => $query->whereRaw("{$receivedSubquery} > 0")
                ->whereRaw("{$receivedSubquery} < freight_invoices.balance_amount"),
            default => null,
        };
    }

    /** @param  Collection<int, FreightInvoice>|SupportCollection<int, FreightInvoice>  $invoices */
    public static function attachSummariesToInvoices(Collection|SupportCollection $invoices): Collection|SupportCollection
    {
        if ($invoices->isEmpty()) {
            return $invoices;
        }

        $receivedByInvoice = InvoicePayment::query()
            ->whereIn('freight_invoice_id', $invoices->pluck('id'))
            ->groupBy('freight_invoice_id')
            ->selectRaw('freight_invoice_id, COALESCE(SUM(amount), 0) as received')
            ->pluck('received', 'freight_invoice_id');

        return $invoices->map(function (FreightInvoice $invoice) use ($receivedByInvoice) {
            $received = round((float) ($receivedByInvoice[$invoice->id] ?? 0), 2);
            $outstanding = max(0, round((float) $invoice->balance_amount - $received, 2));
            $invoice->setAttribute('received', $received);
            $invoice->setAttribute('outstanding', $outstanding);
            $invoice->setAttribute(
                'payment_status',
                self::paymentStatus((float) $invoice->balance_amount, $received, $outstanding),
            );

            return $invoice;
        });
    }

    public static function totalOutstanding(int $userId, ?int $partyId = null): float
    {
        $query = FreightInvoice::query()->where('user_id', $userId);

        if ($partyId !== null) {
            $query->where('party_id', $partyId);
        }

        $total = 0.0;

        foreach ($query->get(['id', 'balance_amount']) as $invoice) {
            $total += self::outstanding($invoice);
        }

        return round($total, 2);
    }

    /**
     * @return SupportCollection<int, array{party_id: int, party_name: string, invoice_count: int, balance_due: float, received: float, outstanding: float}>
     */
    public static function partyOutstandingRows(int $userId, ?int $partyId = null): SupportCollection
    {
        $partiesQuery = Party::query()
            ->where('user_id', $userId)
            ->orderBy('name');

        if ($partyId !== null) {
            $partiesQuery->whereKey($partyId);
        }

        return $partiesQuery->get()->map(function (Party $party) use ($userId) {
            $invoices = FreightInvoice::query()
                ->where('user_id', $userId)
                ->where('party_id', $party->id)
                ->get(['id', 'balance_amount']);

            $balanceDue = round((float) $invoices->sum('balance_amount'), 2);
            $received = 0.0;
            $outstanding = 0.0;

            foreach ($invoices as $invoice) {
                $summary = self::invoiceSummary($invoice);
                $received += $summary['received'];
                $outstanding += $summary['outstanding'];
            }

            return [
                'party_id' => $party->id,
                'party_name' => $party->name,
                'invoice_count' => $invoices->count(),
                'balance_due' => $balanceDue,
                'received' => round($received, 2),
                'outstanding' => round($outstanding, 2),
            ];
        })->filter(fn (array $row) => $row['invoice_count'] > 0 || $row['received'] > 0)->values();
    }
}
