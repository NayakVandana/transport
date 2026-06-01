<?php

namespace App\Support;

use App\Models\FreightInvoice;
use App\Models\InvoicePayment;
use App\Models\Party;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

class InvoicePaymentCalculator
{
    /** @return array{balance_due: float, received: float, outstanding: float} */
    public static function partySummary(int $userId, int $partyId, ?int $excludePaymentId = null): array
    {
        $balanceDue = round((float) FreightInvoice::query()
            ->where('user_id', $userId)
            ->where('party_id', $partyId)
            ->sum('balance_amount'), 2);

        $query = InvoicePayment::query()
            ->where('user_id', $userId)
            ->where('party_id', $partyId);

        if ($excludePaymentId !== null) {
            $query->where('id', '!=', $excludePaymentId);
        }

        $received = round((float) $query->sum('amount'), 2);
        $outstanding = max(0, round($balanceDue - $received, 2));

        return [
            'balance_due' => $balanceDue,
            'received' => $received,
            'outstanding' => $outstanding,
        ];
    }

    /**
     * Allocate party payments to invoices (oldest first). Invoice-linked payments apply to that bill first.
     *
     * @return array<int, float>
     */
    public static function fifoAllocatedReceivedByInvoice(
        int $userId,
        ?int $excludePaymentId = null,
        ?int $partyId = null,
    ): array {
        $allocated = [];

        $partiesQuery = Party::query()->where('user_id', $userId);

        if ($partyId !== null) {
            $partiesQuery->whereKey($partyId);
        }

        foreach ($partiesQuery->get(['id']) as $party) {
            $invoices = FreightInvoice::query()
                ->where('user_id', $userId)
                ->where('party_id', $party->id)
                ->orderBy('invoice_date')
                ->orderBy('id')
                ->get(['id', 'balance_amount']);

            $remaining = [];

            foreach ($invoices as $invoice) {
                $remaining[$invoice->id] = (float) $invoice->balance_amount;
                $allocated[$invoice->id] = 0.0;
            }

            $paymentsQuery = InvoicePayment::query()
                ->where('user_id', $userId)
                ->where('party_id', $party->id)
                ->orderBy('payment_date')
                ->orderBy('id');

            if ($excludePaymentId !== null) {
                $paymentsQuery->where('id', '!=', $excludePaymentId);
            }

            foreach ($paymentsQuery->get(['id', 'freight_invoice_id', 'amount']) as $payment) {
                $amount = (float) $payment->amount;

                if ($payment->freight_invoice_id && isset($remaining[$payment->freight_invoice_id])) {
                    $invId = $payment->freight_invoice_id;
                    $apply = min($amount, max(0, $remaining[$invId]));
                    $allocated[$invId] += $apply;
                    $remaining[$invId] -= $apply;
                    $amount -= $apply;
                }

                foreach ($invoices as $invoice) {
                    if ($amount <= 0) {
                        break;
                    }

                    if ($remaining[$invoice->id] <= 0) {
                        continue;
                    }

                    $apply = min($amount, $remaining[$invoice->id]);
                    $allocated[$invoice->id] += $apply;
                    $remaining[$invoice->id] -= $apply;
                    $amount -= $apply;
                }
            }
        }

        return $allocated;
    }

    public static function receivedAmount(FreightInvoice|int $invoice, ?int $excludePaymentId = null): float
    {
        $invoiceModel = $invoice instanceof FreightInvoice
            ? $invoice
            : FreightInvoice::query()->find($invoice);

        if (! $invoiceModel) {
            return 0.0;
        }

        $allocated = self::fifoAllocatedReceivedByInvoice(
            (int) $invoiceModel->user_id,
            $excludePaymentId,
            (int) $invoiceModel->party_id,
        );

        return round((float) ($allocated[$invoiceModel->id] ?? 0), 2);
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
    public static function applyPaymentStatusFilter($query, string $paymentStatus, int $userId): void
    {
        if ($paymentStatus === '') {
            return;
        }

        $baseQuery = clone $query;
        $candidates = $baseQuery->get();
        self::attachSummariesToInvoices($candidates);

        $matchingIds = $candidates
            ->filter(fn (FreightInvoice $invoice) => $invoice->getAttribute('payment_status') === $paymentStatus)
            ->pluck('id')
            ->all();

        if ($matchingIds === []) {
            $query->whereRaw('0 = 1');

            return;
        }

        $query->whereIn('id', $matchingIds);
    }

    /** @param  Collection<int, FreightInvoice>|SupportCollection<int, FreightInvoice>  $invoices */
    public static function attachSummariesToInvoices(Collection|SupportCollection $invoices): Collection|SupportCollection
    {
        if ($invoices->isEmpty()) {
            return $invoices;
        }

        $userId = (int) $invoices->first()->user_id;
        $allocated = self::fifoAllocatedReceivedByInvoice($userId);

        return $invoices->map(function (FreightInvoice $invoice) use ($allocated) {
            $received = round((float) ($allocated[$invoice->id] ?? 0), 2);
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
        $partiesQuery = Party::query()->where('user_id', $userId);

        if ($partyId !== null) {
            $partiesQuery->whereKey($partyId);
        }

        $total = 0.0;

        foreach ($partiesQuery->pluck('id') as $id) {
            $total += self::partySummary($userId, (int) $id)['outstanding'];
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
            $invoiceCount = FreightInvoice::query()
                ->where('user_id', $userId)
                ->where('party_id', $party->id)
                ->count();

            $summary = self::partySummary($userId, $party->id);

            return [
                'party_id' => $party->id,
                'party_name' => $party->name,
                'invoice_count' => $invoiceCount,
                'balance_due' => $summary['balance_due'],
                'received' => $summary['received'],
                'outstanding' => $summary['outstanding'],
            ];
        })->filter(fn (array $row) => $row['invoice_count'] > 0 || $row['received'] > 0)->values();
    }
}
