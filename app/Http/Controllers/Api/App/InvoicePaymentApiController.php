<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\FreightInvoice;
use App\Models\InvoicePayment;
use App\Support\InvoicePaymentCalculator;
use App\Support\InvoicePaymentReport;
use App\Support\ListExport;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InvoicePaymentApiController extends Controller
{
    public function postInvoicePaymentsList(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $filters = InvoicePaymentReport::filtersFromRequest($request, $userId);
            $parties = InvoicePaymentReport::partiesForUser($userId);
            $query = InvoicePaymentReport::filteredQuery($userId, $filters);
            $perPage = (int) ($request->input('per_page') ?: 20);
            $currentPage = (int) ($request->input('current_page') ?: 1);

            $paginator = (clone $query)->paginate($perPage, ['*'], 'page', $currentPage);
            $partyOutstanding = InvoicePaymentCalculator::partyOutstandingRows($userId);

            return $this->sendJsonResponse(true, 'Received payments loaded.', [
                'invoicePayments' => $paginator,
                'parties' => $parties,
                'partyOutstanding' => $partyOutstanding,
                'filters' => $filters,
                'totals' => InvoicePaymentReport::totals($query),
                'filterSummary' => InvoicePaymentReport::filterSummary($filters, $parties),
                'totalOutstanding' => InvoicePaymentCalculator::totalOutstanding($userId),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postInvoicePaymentMeta(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $partyId = $request->input('party_id') ? (int) $request->input('party_id') : null;
            $includeInvoiceId = $request->input('freight_invoice_id')
                ? (int) $request->input('freight_invoice_id')
                : null;
            $billNumber = trim((string) $request->input('bill_number', ''));

            if ($billNumber !== '') {
                $invoiceByBill = FreightInvoice::query()
                    ->where('user_id', $userId)
                    ->where('bill_number', $billNumber)
                    ->first();

                if ($invoiceByBill) {
                    $includeInvoiceId = $invoiceByBill->id;

                    if ($partyId === null) {
                        $partyId = (int) $invoiceByBill->party_id;
                    }
                }
            }

            $partySummary = null;
            $invoiceSummary = null;

            if ($partyId !== null) {
                $ownsParty = \App\Models\Party::query()
                    ->where('user_id', $userId)
                    ->whereKey($partyId)
                    ->exists();

                if ($ownsParty) {
                    $partySummary = InvoicePaymentCalculator::partySummary($userId, $partyId);
                }
            }

            if ($includeInvoiceId !== null) {
                $invoice = FreightInvoice::query()
                    ->where('user_id', $userId)
                    ->find($includeInvoiceId);

                if ($invoice) {
                    $invoiceSummary = InvoicePaymentCalculator::invoiceSummary($invoice);
                }
            }

            return $this->sendJsonResponse(true, 'Payment form data loaded.', [
                'parties' => InvoicePaymentReport::partiesForUser($userId),
                'openInvoices' => InvoicePaymentReport::openInvoicesForUser($userId, $partyId, $includeInvoiceId),
                'partySummary' => $partySummary,
                'invoiceSummary' => $invoiceSummary,
                'paymentModes' => ['cash', 'cheque', 'neft', 'upi', 'other'],
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    /**
     * @return array{0: ?FreightInvoice, 1: array<string, list<string>>}
     */
    private function resolveFreightInvoice(int $userId, ?int $freightInvoiceId, ?string $billNumber): array
    {
        $billNumber = trim((string) $billNumber);

        if ($freightInvoiceId !== null) {
            $invoice = FreightInvoice::query()
                ->where('user_id', $userId)
                ->find($freightInvoiceId);

            if (! $invoice) {
                return [null, ['freight_invoice_id' => ['Invalid bill.']]];
            }

            if ($billNumber !== '' && strcasecmp($invoice->bill_number, $billNumber) !== 0) {
                return [null, ['bill_number' => ['Bill number does not match the selected invoice.']]];
            }

            return [$invoice, []];
        }

        if ($billNumber === '') {
            return [null, [
                'bill_number' => ['Enter a bill number.'],
                'freight_invoice_id' => ['Select a bill (invoice).'],
            ]];
        }

        $invoice = FreightInvoice::query()
            ->where('user_id', $userId)
            ->where('bill_number', $billNumber)
            ->first();

        if (! $invoice) {
            return [null, ['bill_number' => ['Bill number not found.']]];
        }

        return [$invoice, []];
    }

    public function postInvoicePaymentShow(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $userId = (int) $request->user()->id;
            $payment = InvoicePayment::query()
                ->with(['party:id,name', 'freightInvoice:id,bill_number,balance_amount,party_id'])
                ->where('user_id', $userId)
                ->findOrFail($request->input('id'));

            $invoice = $payment->freightInvoice;
            $summary = $invoice
                ? InvoicePaymentCalculator::invoiceSummary($invoice, $payment->id)
                : ['received' => 0, 'outstanding' => 0];

            return $this->sendJsonResponse(true, 'Payment loaded.', [
                'invoicePayment' => $payment,
                'parties' => InvoicePaymentReport::partiesForUser($userId),
                'openInvoices' => InvoicePaymentReport::openInvoicesForUser(
                    $userId,
                    $payment->party_id,
                    $payment->freight_invoice_id,
                ),
                'partySummary' => InvoicePaymentCalculator::partySummary(
                    $userId,
                    $payment->party_id,
                    $payment->id,
                ),
                'paymentModes' => ['cash', 'cheque', 'neft', 'upi', 'other'],
                'invoiceSummary' => $summary,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postInvoicePaymentStore(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'party_id' => ['required', 'integer', 'exists:parties,id'],
                'freight_invoice_id' => ['nullable', 'integer', 'exists:freight_invoices,id'],
                'bill_number' => ['nullable', 'string', 'max:50'],
                'payment_date' => ['required', 'date'],
                'amount' => ['required', 'numeric', 'min:0.01'],
                'payment_mode' => ['nullable', 'string', 'max:20'],
                'reference_no' => ['nullable', 'string', 'max:100'],
                'notes' => ['nullable', 'string', 'max:500'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $validated = $validation->validated();
            $userId = (int) $request->user()->id;
            $amount = round((float) $validated['amount'], 2);

            [$invoice, $resolveErrors] = $this->resolveFreightInvoice(
                $userId,
                isset($validated['freight_invoice_id']) ? (int) $validated['freight_invoice_id'] : null,
                $validated['bill_number'] ?? null,
            );

            if ($resolveErrors !== []) {
                return $this->sendJsonResponse(false, collect($resolveErrors)->flatten()->first(), $resolveErrors, 200);
            }

            $freightInvoiceId = (int) $invoice->id;

            $partyId = (int) $invoice->party_id;

            if ((int) $validated['party_id'] !== $partyId) {
                return $this->sendJsonResponse(false, 'Party does not match the selected bill.', [
                    'party_id' => ['Party does not match the selected bill.'],
                ], 200);
            }

            $party = \App\Models\Party::query()
                ->where('user_id', $userId)
                ->find($partyId);

            if (! $party) {
                return $this->sendJsonResponse(false, 'Invalid party.', [
                    'party_id' => ['Invalid party.'],
                ], 200);
            }

            $invoiceOutstanding = InvoicePaymentCalculator::outstanding($invoice);

            if ($amount > $invoiceOutstanding) {
                $message = 'Payment amount exceeds bill outstanding (₹ '.number_format($invoiceOutstanding, 2).').';

                return $this->sendJsonResponse(false, $message, [
                    'amount' => [$message],
                ], 200);
            }

            $payment = InvoicePayment::query()->create([
                'freight_invoice_id' => $freightInvoiceId,
                'bill_number' => $invoice->bill_number,
                'party_id' => $partyId,
                'payment_date' => $validated['payment_date'],
                'amount' => $amount,
                'payment_mode' => $validated['payment_mode'] ?? null,
                'reference_no' => $validated['reference_no'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'user_id' => $userId,
            ]);

            return $this->sendJsonResponse(true, 'Payment recorded.', [
                'invoicePayment' => $payment->load(['party:id,name', 'freightInvoice:id,bill_number,balance_amount']),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postInvoicePaymentUpdate(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
                'party_id' => ['required', 'integer', 'exists:parties,id'],
                'freight_invoice_id' => ['nullable', 'integer', 'exists:freight_invoices,id'],
                'bill_number' => ['nullable', 'string', 'max:50'],
                'payment_date' => ['required', 'date'],
                'amount' => ['required', 'numeric', 'min:0.01'],
                'payment_mode' => ['nullable', 'string', 'max:20'],
                'reference_no' => ['nullable', 'string', 'max:100'],
                'notes' => ['nullable', 'string', 'max:500'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $validated = $validation->validated();
            $userId = (int) $request->user()->id;
            $payment = InvoicePayment::query()
                ->where('user_id', $userId)
                ->findOrFail($validated['id']);

            $amount = round((float) $validated['amount'], 2);

            [$invoice, $resolveErrors] = $this->resolveFreightInvoice(
                $userId,
                isset($validated['freight_invoice_id']) ? (int) $validated['freight_invoice_id'] : null,
                $validated['bill_number'] ?? null,
            );

            if ($resolveErrors !== []) {
                return $this->sendJsonResponse(false, collect($resolveErrors)->flatten()->first(), $resolveErrors, 200);
            }

            $freightInvoiceId = (int) $invoice->id;

            $partyId = (int) $invoice->party_id;

            if ((int) $validated['party_id'] !== $partyId) {
                return $this->sendJsonResponse(false, 'Party does not match the selected bill.', [
                    'party_id' => ['Party does not match the selected bill.'],
                ], 200);
            }

            $invoiceOutstanding = InvoicePaymentCalculator::outstanding($invoice, $payment->id);

            if ($amount > $invoiceOutstanding) {
                $message = 'Payment amount exceeds bill outstanding (₹ '.number_format($invoiceOutstanding, 2).').';

                return $this->sendJsonResponse(false, $message, [
                    'amount' => [$message],
                ], 200);
            }

            $payment->update([
                'freight_invoice_id' => $freightInvoiceId,
                'bill_number' => $invoice->bill_number,
                'party_id' => $partyId,
                'payment_date' => $validated['payment_date'],
                'amount' => $amount,
                'payment_mode' => $validated['payment_mode'] ?? null,
                'reference_no' => $validated['reference_no'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            return $this->sendJsonResponse(true, 'Payment updated.', [
                'invoicePayment' => $payment->fresh()->load(['party:id,name', 'freightInvoice:id,bill_number,balance_amount']),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postInvoicePaymentDestroy(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $payment = InvoicePayment::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $payment->delete();

            return $this->sendJsonResponse(true, 'Payment removed.', null, 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postInvoicePaymentsExportCsv(Request $request): StreamedResponse|JsonResponse
    {
        try {
            $userId = (int) $request->user()->id;
            $filters = InvoicePaymentReport::filtersFromRequest($request, $userId);
            $parties = InvoicePaymentReport::partiesForUser($userId);
            $query = InvoicePaymentReport::filteredQuery($userId, $filters);
            $rows = $query->get();
            $totals = InvoicePaymentReport::totals($query);

            return ListExport::csv(
                'invoice-payments',
                'Received Payments Export',
                InvoicePaymentReport::filterSummary($filters, $parties),
                ['Date', 'Bill No.', 'Party', 'Amount', 'Mode', 'Reference', 'Notes'],
                $rows->map(fn ($row) => [
                    ListExport::formatDate($row->payment_date),
                    $row->bill_number ?? $row->freightInvoice?->bill_number ?? '',
                    $row->party?->name ?? '',
                    $row->amount,
                    $row->payment_mode ?? '',
                    $row->reference_no ?? '',
                    $row->notes ?? '',
                ]),
                [
                    'TOTAL',
                    $totals['count'].' payments',
                    '',
                    ListExport::formatMoney($totals['amount']),
                    '',
                    '',
                    '',
                ],
            );
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postInvoicePaymentsExportPdf(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $filters = InvoicePaymentReport::filtersFromRequest($request, $userId);
            $parties = InvoicePaymentReport::partiesForUser($userId);
            $query = InvoicePaymentReport::filteredQuery($userId, $filters);
            $rows = $query->get();
            $totals = InvoicePaymentReport::totals($query);

            return ListExport::pdf(
                'invoice-payments',
                'Received Payments Report',
                InvoicePaymentReport::filterSummary($filters, $parties),
                ['Date', 'Bill No.', 'Party', 'Amount', 'Mode', 'Reference'],
                $rows->map(fn ($row) => [
                    ListExport::formatDate($row->payment_date),
                    $row->bill_number ?? $row->freightInvoice?->bill_number ?? '—',
                    $row->party?->name ?? '—',
                    ListExport::formatMoney($row->amount),
                    $row->payment_mode ?? '—',
                    $row->reference_no ?? '—',
                ]),
                $rows->count(),
                [
                    'TOTAL',
                    $totals['count'].' payments',
                    '',
                    ListExport::formatMoney($totals['amount']),
                    '',
                    '',
                ],
            );
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }
}
