<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Support\ListFilter;
use App\Support\PaymentValidation;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class PaymentApiController extends Controller
{
    public function postPaymentsList(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $perPage = (int) ($request->input('per_page') ?: 20);
            $currentPage = (int) ($request->input('current_page') ?: 1);
            $dateFilters = ListFilter::dateFromRequest($request);
            $search = ListFilter::searchFromRequest($request);
            $customerId = ListFilter::optionalIdFromRequest($request, 'customer_id');

            $validated = $request->validate([
                'direction' => ['nullable', 'string', Rule::in(PaymentValidation::directions())],
                'payment_method' => ['nullable', 'string', Rule::in(PaymentValidation::paymentMethods())],
            ]);
            $direction = $validated['direction'] ?? '';
            $paymentMethod = $validated['payment_method'] ?? '';

            if ($customerId !== '') {
                $ownsCustomer = \App\Models\Customer::query()
                    ->where('user_id', $userId)
                    ->whereKey($customerId)
                    ->exists();
                if (! $ownsCustomer) {
                    $customerId = '';
                }
            }

            $query = Payment::query()
                ->with([
                    'customer:id,name',
                    'booking:id,booking_date,vehicle_id',
                    'booking.vehicle:id,vehicle_number',
                    'freightInvoice:id,bill_number,invoice_date',
                ])
                ->where('user_id', $userId);
            ListFilter::applyDate($query, $dateFilters, 'payment_date');
            ListFilter::applySearch($query, $search, ['reference_number', 'notes']);
            if ($customerId !== '') {
                $query->where('customer_id', $customerId);
            }
            if ($direction !== '') {
                $query->where('direction', $direction);
            }
            if ($paymentMethod !== '') {
                $query->where('payment_method', $paymentMethod);
            }
            $query->orderByDesc('payment_date')->orderByDesc('id');

            $totalReceipts = (float) (clone $query)->toBase()->where('direction', 'receipt')->sum('amount');
            $totalPayouts = (float) (clone $query)->toBase()->where('direction', 'payout')->sum('amount');
            $payments = $query->paginate($perPage, ['*'], 'page', $currentPage);

            $customers = PaymentValidation::customersForUser($userId);
            $customerName = $customerId !== ''
                ? $customers->firstWhere('id', (int) $customerId)?->name
                : null;

            $filterSummary = ListFilter::summary([
                $search !== '' ? 'Search: '.$search : null,
                $direction !== '' ? 'Type: '.ucfirst($direction) : null,
                $paymentMethod !== '' ? 'Method: '.strtoupper($paymentMethod) : null,
                $customerName ? 'Customer: '.$customerName : null,
                ListFilter::dateSummary($dateFilters),
            ], 'All payments');

            return $this->sendJsonResponse(true, 'Payments loaded.', [
                'payments' => $payments,
                'total_receipts' => round($totalReceipts, 2),
                'total_payouts' => round($totalPayouts, 2),
                'customers' => $customers,
                'directions' => PaymentValidation::optionsForFrontend()['directions'],
                'payment_methods' => PaymentValidation::optionsForFrontend()['payment_methods'],
                'filters' => [
                    'search' => $search,
                    'direction' => $direction,
                    'payment_method' => $paymentMethod,
                    'customer_id' => $customerId,
                    ...$dateFilters,
                ],
                'filterSummary' => $filterSummary,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postPaymentMeta(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;

            return $this->sendJsonResponse(true, 'Payment form data loaded.', [
                ...PaymentValidation::optionsForFrontend(),
                'customers' => PaymentValidation::customersForUser($userId),
                'bookings' => PaymentValidation::bookingsForUser($userId),
                'invoices' => PaymentValidation::invoicesForUser($userId),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postPaymentShow(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $userId = (int) $request->user()->id;
            $payment = Payment::query()
                ->with([
                    'customer:id,name',
                    'booking:id,booking_date,vehicle_id',
                    'booking.vehicle:id,vehicle_number',
                    'freightInvoice:id,bill_number,invoice_date',
                ])
                ->where('user_id', $userId)
                ->findOrFail($request->input('id'));

            return $this->sendJsonResponse(true, 'Payment loaded.', [
                'payment' => $payment,
                ...PaymentValidation::optionsForFrontend(),
                'customers' => PaymentValidation::customersForUser($userId),
                'bookings' => PaymentValidation::bookingsForUser($userId),
                'invoices' => PaymentValidation::invoicesForUser($userId),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postPaymentStore(Request $request)
    {
        try {
            $this->normalizeInput($request);
            $validation = Validator::make($request->all(), $this->rules($request));

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $payment = Payment::query()->create([
                ...$validation->validated(),
                'user_id' => $request->user()->id,
            ]);

            return $this->sendJsonResponse(true, 'Payment recorded.', [
                'payment' => $payment->load([
                    'customer:id,name',
                    'booking:id,booking_date,vehicle_id',
                    'booking.vehicle:id,vehicle_number',
                    'freightInvoice:id,bill_number,invoice_date',
                ]),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postPaymentUpdate(Request $request)
    {
        try {
            $this->normalizeInput($request);
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
                ...$this->rules($request),
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $payment = Payment::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $data = $validation->validated();
            unset($data['id']);
            $payment->update($data);

            return $this->sendJsonResponse(true, 'Payment updated.', [
                'payment' => $payment->fresh()->load([
                    'customer:id,name',
                    'booking:id,booking_date,vehicle_id',
                    'booking.vehicle:id,vehicle_number',
                    'freightInvoice:id,bill_number,invoice_date',
                ]),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postPaymentDestroy(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $payment = Payment::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $payment->delete();

            return $this->sendJsonResponse(true, 'Payment deleted.', null, 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    /** @return array<string, list<mixed>> */
    private function rules(Request $request): array
    {
        $userId = (int) $request->user()->id;

        return [
            'payment_date' => ['required', 'date'],
            'direction' => ['required', 'string', Rule::in(PaymentValidation::directions())],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'string', Rule::in(PaymentValidation::paymentMethods())],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
            'customer_id' => [
                'nullable',
                'integer',
                Rule::exists('customers', 'id')->where(
                    fn ($query) => $query->where('user_id', $userId),
                ),
            ],
            'booking_id' => [
                'nullable',
                'integer',
                Rule::exists('bookings', 'id')->where(
                    fn ($query) => $query->where('user_id', $userId)->whereNull('deleted_at'),
                ),
            ],
            'freight_invoice_id' => [
                'nullable',
                'integer',
                Rule::exists('freight_invoices', 'id')->where(
                    fn ($query) => $query->where('user_id', $userId),
                ),
            ],
        ];
    }

    private function normalizeInput(Request $request): void
    {
        $request->merge([
            'customer_id' => $request->filled('customer_id') ? (int) $request->input('customer_id') : null,
            'booking_id' => $request->filled('booking_id') ? (int) $request->input('booking_id') : null,
            'freight_invoice_id' => $request->filled('freight_invoice_id') ? (int) $request->input('freight_invoice_id') : null,
            'reference_number' => $request->input('reference_number') ?: null,
            'notes' => $request->input('notes') ?: null,
        ]);
    }
}
