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

            $partySummary = null;

            if ($partyId !== null) {
                $ownsParty = \App\Models\Party::query()
                    ->where('user_id', $userId)
                    ->whereKey($partyId)
                    ->exists();

                if ($ownsParty) {
                    $partySummary = InvoicePaymentCalculator::partySummary($userId, $partyId);
                }
            }

            return $this->sendJsonResponse(true, 'Payment form data loaded.', [
                'parties' => InvoicePaymentReport::partiesForUser($userId),
                'openInvoices' => InvoicePaymentReport::openInvoicesForUser($userId, $partyId, $includeInvoiceId),
                'partySummary' => $partySummary,
                'paymentModes' => ['cash', 'cheque', 'neft', 'upi', 'other'],
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
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
            $partyId = (int) $validated['party_id'];

            $party = \App\Models\Party::query()
                ->where('user_id', $userId)
                ->find($partyId);

            if (! $party) {
                return $this->sendJsonResponse(false, 'Invalid party.', [
                    'party_id' => ['Invalid party.'],
                ], 200);
            }

            $amount = round((float) $validated['amount'], 2);
            $partyOutstanding = InvoicePaymentCalculator::partySummary($userId, $partyId)['outstanding'];

            if ($amount > $partyOutstanding) {
                $message = 'Payment amount exceeds party outstanding (₹ '.number_format($partyOutstanding, 2).').';

                return $this->sendJsonResponse(false, $message, [
                    'amount' => [$message],
                ], 200);
            }

            $freightInvoiceId = isset($validated['freight_invoice_id']) ? (int) $validated['freight_invoice_id'] : null;

            if ($freightInvoiceId !== null) {
                $invoice = FreightInvoice::query()
                    ->where('user_id', $userId)
                    ->where('party_id', $partyId)
                    ->find($freightInvoiceId);

                if (! $invoice) {
                    return $this->sendJsonResponse(false, 'Invalid invoice for this party.', [
                        'freight_invoice_id' => ['Invalid invoice for this party.'],
                    ], 200);
                }

                $invoiceOutstanding = InvoicePaymentCalculator::outstanding($invoice);

                if ($amount > $invoiceOutstanding) {
                    $message = 'Payment amount exceeds invoice outstanding (₹ '.number_format($invoiceOutstanding, 2).').';

                    return $this->sendJsonResponse(false, $message, [
                        'amount' => [$message],
                    ], 200);
                }
            }

            $payment = InvoicePayment::query()->create([
                'freight_invoice_id' => $freightInvoiceId,
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

            $partyId = (int) $validated['party_id'];

            $party = \App\Models\Party::query()
                ->where('user_id', $userId)
                ->find($partyId);

            if (! $party) {
                return $this->sendJsonResponse(false, 'Invalid party.', [
                    'party_id' => ['Invalid party.'],
                ], 200);
            }

            $amount = round((float) $validated['amount'], 2);
            $partyOutstanding = InvoicePaymentCalculator::partySummary($userId, $partyId, $payment->id)['outstanding'];

            if ($amount > $partyOutstanding) {
                $message = 'Payment amount exceeds party outstanding (₹ '.number_format($partyOutstanding, 2).').';

                return $this->sendJsonResponse(false, $message, [
                    'amount' => [$message],
                ], 200);
            }

            $freightInvoiceId = isset($validated['freight_invoice_id']) ? (int) $validated['freight_invoice_id'] : null;

            if ($freightInvoiceId !== null) {
                $invoice = FreightInvoice::query()
                    ->where('user_id', $userId)
                    ->where('party_id', $partyId)
                    ->find($freightInvoiceId);

                if (! $invoice) {
                    return $this->sendJsonResponse(false, 'Invalid invoice for this party.', [
                        'freight_invoice_id' => ['Invalid invoice for this party.'],
                    ], 200);
                }

                $invoiceOutstanding = InvoicePaymentCalculator::outstanding($invoice, $payment->id);

                if ($amount > $invoiceOutstanding) {
                    $message = 'Payment amount exceeds invoice outstanding (₹ '.number_format($invoiceOutstanding, 2).').';

                    return $this->sendJsonResponse(false, $message, [
                        'amount' => [$message],
                    ], 200);
                }
            }

            $payment->update([
                'freight_invoice_id' => $freightInvoiceId,
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
                    $row->freightInvoice?->bill_number ?? '',
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
                    $row->freightInvoice?->bill_number ?? '—',
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
