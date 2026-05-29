<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Customer;
use App\Models\FreightInvoice;
use App\Models\RouteLocation;
use App\Models\Vehicle;
use App\Support\AmountInWords;
use App\Support\EntryNumberGenerator;
use App\Support\FreightInvoiceCalculator;
use App\Support\ListFilter;
use Exception;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class FreightInvoiceApiController extends Controller
{
    public function postInvoicesList(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $perPage = (int) ($request->input('per_page') ?: 15);
            $currentPage = (int) ($request->input('current_page') ?: 1);
            $dateFilters = ListFilter::dateFromRequest($request);
            $search = ListFilter::searchFromRequest($request);
            $customerId = ListFilter::optionalIdFromRequest($request, 'customer_id');
            $status = ListFilter::statusFromRequest($request, ['draft', 'finalized']);

            $query = FreightInvoice::query()
                ->where('user_id', $userId)
                ->with(['customer:id,name', 'company:id,name']);
            ListFilter::applyDate($query, $dateFilters, 'invoice_date');
            ListFilter::applySearch($query, $search, ['bill_number']);
            if ($customerId !== '') {
                $query->where('customer_id', $customerId);
            }
            if ($status !== '') {
                $query->where('status', $status);
            }
            $query->orderByDesc('invoice_date')->orderByDesc('id');

            $invoices = $query->paginate($perPage, ['*'], 'page', $currentPage);
            $customers = Customer::query()
                ->where('user_id', $userId)
                ->orderBy('name')
                ->get(['id', 'name']);

            $customerName = $customerId !== ''
                ? $customers->firstWhere('id', (int) $customerId)?->name
                : null;

            $filterSummary = ListFilter::summary([
                $search !== '' ? 'Search: '.$search : null,
                $status !== '' ? 'Status: '.ucfirst($status) : null,
                $customerName ? 'Customer: '.$customerName : null,
                ListFilter::dateSummary($dateFilters),
            ], 'All invoices');

            return $this->sendJsonResponse(true, 'Invoices loaded.', [
                'invoices' => $invoices,
                'customers' => $customers,
                'filters' => [
                    'search' => $search,
                    'status' => $status,
                    'customer_id' => $customerId,
                    ...$dateFilters,
                ],
                'filterSummary' => $filterSummary,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postInvoiceMeta(Request $request)
    {
        try {
            $company = Company::query()->where('user_id', $request->user()->id)->first();

            if (! $company) {
                return $this->sendJsonResponse(false, 'Set up your company profile before creating invoices.', null, 200);
            }

            return $this->sendJsonResponse(true, 'Invoice form data loaded.', [
                ...$this->formLookups($request, $company),
                'nextBillNumber' => $this->suggestBillNumber($request),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postInvoiceShow(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $invoice = FreightInvoice::query()
                ->where('user_id', $request->user()->id)
                ->with(['company', 'customer', 'lines'])
                ->findOrFail($request->input('id'));

            return $this->sendJsonResponse(true, 'Invoice loaded.', [
                'invoice' => $invoice,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postInvoiceStore(Request $request)
    {
        try {
            $company = Company::query()->where('user_id', $request->user()->id)->first();

            if (! $company) {
                return $this->sendJsonResponse(false, 'Set up your company profile before creating invoices.', null, 200);
            }

            $validated = $this->validatedInvoice($request);
            if ($validated instanceof JsonResponse) {
                return $validated;
            }
            $lines = $validated['lines'];
            unset($validated['lines']);

            [$totals, $lineFreights] = FreightInvoiceCalculator::forPersistence(
                $lines,
                (float) $company->igst_rate,
            );

            $invoice = DB::transaction(function () use ($request, $company, $validated, $lines, $totals, $lineFreights) {
                $invoice = FreightInvoice::query()->create([
                    ...$validated,
                    'user_id' => $request->user()->id,
                    'company_id' => $company->id,
                    'sac_code' => $validated['sac_code'] ?? $company->sac_code,
                    'igst_rate' => $company->igst_rate,
                    ...$totals,
                    'balance_in_words' => AmountInWords::rupees($totals['balance_amount']),
                ]);

                $this->syncLines($invoice, $lines, $lineFreights);

                return $invoice;
            });

            EntryNumberGenerator::syncCompanySequence(
                $company,
                collect($lines)->pluck('entry_number')->filter()->all(),
            );

            return $this->sendJsonResponse(true, 'Invoice created.', [
                'invoice' => $invoice->load(['company', 'customer', 'lines']),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postInvoiceUpdate(Request $request)
    {
        try {
            $idValidation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($idValidation->fails()) {
                return $this->sendJsonResponse(false, $idValidation->errors()->first(), $idValidation->errors()->getMessages(), 200);
            }

            $invoice = FreightInvoice::query()
                ->where('user_id', $request->user()->id)
                ->with('company')
                ->findOrFail($request->input('id'));

            $company = $invoice->company;
            $validated = $this->validatedInvoice($request, $invoice->id);
            if ($validated instanceof JsonResponse) {
                return $validated;
            }
            $lines = $validated['lines'];
            unset($validated['lines']);

            [$totals, $lineFreights] = FreightInvoiceCalculator::forPersistence(
                $lines,
                (float) $company->igst_rate,
            );

            DB::transaction(function () use ($invoice, $validated, $lines, $totals, $lineFreights) {
                $invoice->update([
                    ...$validated,
                    ...$totals,
                    'balance_in_words' => AmountInWords::rupees($totals['balance_amount']),
                ]);

                $invoice->lines()->delete();
                $this->syncLines($invoice, $lines, $lineFreights);
            });

            EntryNumberGenerator::syncCompanySequence(
                $invoice->company,
                collect($lines)->pluck('entry_number')->filter()->all(),
            );

            return $this->sendJsonResponse(true, 'Invoice updated.', [
                'invoice' => $invoice->fresh()->load(['company', 'customer', 'lines']),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postInvoiceDestroy(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $invoice = FreightInvoice::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $invoice->delete();

            return $this->sendJsonResponse(true, 'Invoice deleted.', null, 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    /** @return array<string, mixed> */
    private function formLookups(Request $request, Company $company): array
    {
        $userId = $request->user()->id;
        $nextSequence = EntryNumberGenerator::resolveNextSequence($company);

        return [
            'company' => $company,
            'customers' => $this->customersForUser($request),
            'vehicles' => Vehicle::query()->forUser($userId)->orderBy('vehicle_number')->get(['id', 'vehicle_number']),
            'routeLocations' => RouteLocation::query()->forUser($userId)->orderBy('name')->get(['id', 'name']),
            'entrySettings' => [
                'prefix' => $company->entry_number_prefix,
                'nextSequence' => $nextSequence,
            ],
        ];
    }

    /** @return Collection<int, Customer> */
    private function customersForUser(Request $request)
    {
        return Customer::query()
            ->where('user_id', $request->user()->id)
            ->orderBy('name')
            ->get(['id', 'name', 'mobile', 'address', 'state_code']);
    }

    private function suggestBillNumber(Request $request): string
    {
        $year = now()->format('y');
        $prefix = 'R'.now()->format('y').(now()->month >= 4 ? now()->addYear()->format('y') : $year);

        $last = FreightInvoice::query()
            ->where('user_id', $request->user()->id)
            ->where('bill_number', 'like', $prefix.'-%')
            ->orderByDesc('bill_number')
            ->value('bill_number');

        $seq = 1;
        if ($last && preg_match('/-(\d+)$/', $last, $m)) {
            $seq = (int) $m[1] + 1;
        }

        return sprintf('%s-%04d', $prefix, $seq);
    }

    /** @param  list<array<string, mixed>>  $lines
     * @param  list<float>  $freights
     */
    private function syncLines(FreightInvoice $invoice, array $lines, array $freights): void
    {
        foreach ($lines as $index => $line) {
            $invoice->lines()->create([
                'serial_number' => $index + 1,
                'entry_number' => $line['entry_number'] ?? null,
                'entry_date' => $line['entry_date'] ?? null,
                'vehicle_number' => $line['vehicle_number'] ?? null,
                'route_from' => $line['route_from'] ?? null,
                'product_name' => $line['product_name'] ?? null,
                'weight' => $line['weight'] ?? 1,
                'rate' => $line['rate'] ?? 0,
                'freight' => $freights[$index] ?? 0,
                'advance_paid' => $line['advance_paid'] ?? 0,
                'empty_container_charge' => $line['empty_container_charge'] ?? 0,
            ]);
        }
    }

    /** @return array<string, mixed>|JsonResponse */
    private function validatedInvoice(Request $request, ?int $ignoreId = null): array|JsonResponse
    {
        $billUnique = 'unique:freight_invoices,bill_number';
        if ($ignoreId) {
            $billUnique .= ','.$ignoreId;
        }

        $rules = [
            'customer_id' => ['required', 'exists:customers,id'],
            'bill_number' => ['required', 'string', 'max:50', $billUnique],
            'invoice_date' => ['required', 'date'],
            'sac_code' => ['nullable', 'string', 'max:10'],
            'status' => ['required', 'in:draft,finalized'],
            'prepared_by' => ['nullable', 'string', 'max:100'],
            'checked_by' => ['nullable', 'string', 'max:100'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.entry_number' => ['nullable', 'string', 'max:50'],
            'lines.*.entry_date' => ['nullable', 'date'],
            'lines.*.vehicle_number' => ['nullable', 'string', 'max:20'],
            'lines.*.route_from' => ['nullable', 'string', 'max:255'],
            'lines.*.product_name' => ['nullable', 'string', 'max:255'],
            'lines.*.weight' => ['required', 'numeric', 'min:0'],
            'lines.*.rate' => ['required', 'numeric', 'min:0'],
            'lines.*.advance_paid' => ['nullable', 'numeric', 'min:0'],
            'lines.*.empty_container_charge' => ['nullable', 'numeric', 'min:0'],
        ];

        $validation = Validator::make($request->all(), $rules);

        if ($validation->fails()) {
            return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
        }

        $validated = $validation->validated();

        $customer = Customer::query()->find($validated['customer_id']);
        if (! $customer || $customer->user_id !== $request->user()->id) {
            return $this->sendJsonResponse(false, 'Invalid customer.', null, 200);
        }

        return $validated;
    }
}
