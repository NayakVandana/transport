<?php

namespace App\Support;

use App\Models\FreightInvoice;
use App\Models\InvoicePayment;
use App\Models\Party;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class InvoicePaymentReport
{
    /** @return Collection<int, Party> */
    public static function partiesForUser(int $userId): Collection
    {
        return Party::query()
            ->where('user_id', $userId)
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    /**
     * @return list<array{id: int, bill_number: string, party_id: int, party_name: string, balance_amount: float, received: float, outstanding: float}>
     */
    public static function openInvoicesForUser(int $userId, ?int $partyId = null, ?int $includeInvoiceId = null): array
    {
        $query = FreightInvoice::query()
            ->with(['party:id,name'])
            ->where('user_id', $userId)
            ->orderByDesc('invoice_date');

        if ($partyId !== null) {
            $query->where('party_id', $partyId);
        }

        $rows = [];
        $includedIds = [];

        foreach ($query->get() as $invoice) {
            $summary = InvoicePaymentCalculator::invoiceSummary($invoice);
            $forceInclude = $includeInvoiceId !== null && $invoice->id === $includeInvoiceId;

            if (! $forceInclude && $summary['outstanding'] <= 0 && $summary['received'] <= 0) {
                continue;
            }

            $includedIds[] = $invoice->id;
            $rows[] = self::openInvoiceRow($invoice, $summary);
        }

        if ($includeInvoiceId !== null && ! in_array($includeInvoiceId, $includedIds, true)) {
            $invoice = FreightInvoice::query()
                ->with(['party:id,name'])
                ->where('user_id', $userId)
                ->find($includeInvoiceId);

            if ($invoice) {
                $rows[] = self::openInvoiceRow($invoice, InvoicePaymentCalculator::invoiceSummary($invoice));
            }
        }

        return $rows;
    }

    /** @param  array{received: float, outstanding: float}  $summary */
    private static function openInvoiceRow(FreightInvoice $invoice, array $summary): array
    {
        return [
            'id' => $invoice->id,
            'bill_number' => $invoice->bill_number,
            'party_id' => $invoice->party_id,
            'party_name' => $invoice->party?->name ?? '',
            'balance_amount' => (float) $invoice->balance_amount,
            'received' => $summary['received'],
            'outstanding' => $summary['outstanding'],
        ];
    }

    /** @return array<string, string> */
    public static function filtersFromRequest(Request $request, int $userId): array
    {
        $dateFilters = ListFilter::dateFromRequest($request);
        $search = ListFilter::searchFromRequest($request);
        $partyId = ListFilter::optionalIdFromRequest($request, 'party_id');
        $invoiceId = ListFilter::optionalIdFromRequest($request, 'freight_invoice_id');

        if ($partyId !== '') {
            $ownsParty = Party::query()->where('user_id', $userId)->whereKey($partyId)->exists();
            if (! $ownsParty) {
                $partyId = '';
            }
        }

        if ($invoiceId !== '') {
            $ownsInvoice = FreightInvoice::query()->where('user_id', $userId)->whereKey($invoiceId)->exists();
            if (! $ownsInvoice) {
                $invoiceId = '';
            }
        }

        return [
            'search' => $search,
            'party_id' => $partyId,
            'freight_invoice_id' => $invoiceId,
            ...$dateFilters,
        ];
    }

    /** @param  array<string, string>  $filters */
    public static function filteredQuery(int $userId, array $filters): Builder
    {
        $query = InvoicePayment::query()
            ->with([
                'party:id,name',
                'freightInvoice:id,bill_number,balance_amount,party_id',
            ])
            ->where('user_id', $userId);

        ListFilter::applyDate($query, $filters, 'payment_date');

        $search = $filters['search'] ?? '';
        if ($search !== '') {
            $query->where(function (Builder $builder) use ($search) {
                $builder
                    ->where('reference_no', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('freightInvoice', fn (Builder $q) => $q->where('bill_number', 'like', "%{$search}%"))
                    ->orWhereHas('party', fn (Builder $q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        if (($filters['party_id'] ?? '') !== '') {
            $query->where('party_id', $filters['party_id']);
        }

        if (($filters['freight_invoice_id'] ?? '') !== '') {
            $query->where('freight_invoice_id', $filters['freight_invoice_id']);
        }

        return $query->orderByDesc('payment_date')->orderByDesc('id');
    }

    /** @param  array<string, string>  $filters */
    public static function filterSummary(array $filters, Collection $parties): string
    {
        $partyLabel = ($filters['party_id'] ?? '') !== ''
            ? 'Party: '.($parties->firstWhere('id', (int) $filters['party_id'])?->name ?? '')
            : null;

        return ListFilter::summary([
            ($filters['search'] ?? '') !== '' ? 'Search: '.$filters['search'] : null,
            $partyLabel,
            ListFilter::dateSummary($filters),
        ], 'All received payments');
    }

    /** @return array{count: int, amount: float} */
    public static function totals(Builder $query): array
    {
        $base = (clone $query)->toBase();

        return [
            'count' => (int) (clone $base)->count(),
            'amount' => round((float) (clone $base)->sum('amount'), 2),
        ];
    }
}
