<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Party;
use App\Models\Entrybook;
use App\Models\FreightInvoice;
use App\Models\RouteLocation;
use App\Models\Vehicle;
use App\Support\AmountInWords;
use App\Support\EntryNumberGenerator;
use App\Support\FreightInvoiceCalculator;
use App\Support\InvoicePaymentCalculator;
use App\Support\ListExport;
use App\Support\TaxInvoicePdf;
use App\Support\ListFilter;
use Exception;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FreightInvoiceApiController extends Controller
{
    public function postInvoicesList(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $perPage = (int) ($request->input('per_page') ?: 15);
            $currentPage = (int) ($request->input('current_page') ?: 1);
            [$query, $filterSummary, $filters] = $this->filteredInvoicesQuery($request, $userId);

            $invoices = $query->paginate($perPage, ['*'], 'page', $currentPage);
            InvoicePaymentCalculator::attachSummariesToInvoices($invoices->getCollection());
            $parties = Party::query()
                ->where('user_id', $userId)
                ->orderBy('name')
                ->get(['id', 'name']);

            return $this->sendJsonResponse(true, 'Invoices loaded.', [
                'invoices' => $invoices,
                'parties' => $parties,
                'filters' => $filters,
                'filterSummary' => $filterSummary,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postInvoicesExportCsv(Request $request): StreamedResponse|JsonResponse
    {
        try {
            $userId = (int) $request->user()->id;
            [$query, $filterSummary] = $this->filteredInvoicesQuery($request, $userId);
            $invoices = $query->get();
            $totals = $this->invoiceExportTotals($invoices);

            return ListExport::csv(
                'invoices',
                'Invoices Export',
                $filterSummary,
                ['Date', 'Bill No.', 'Party', 'Status', 'Net Value', 'IGST', 'Balance'],
                $invoices->map(fn ($invoice) => [
                    ListExport::formatDate($invoice->invoice_date),
                    $invoice->bill_number,
                    $invoice->party?->name ?? '',
                    ucfirst($invoice->status),
                    $invoice->net_value,
                    $invoice->igst_amount,
                    $invoice->balance_amount,
                ]),
                [
                    'TOTAL',
                    $invoices->count().' invoices',
                    '',
                    '',
                    ListExport::formatMoney($totals['net_value']),
                    ListExport::formatMoney($totals['igst_amount']),
                    ListExport::formatMoney($totals['balance_amount']),
                ],
            );
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postInvoicesExportPdf(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            [$query, $filterSummary] = $this->filteredInvoicesQuery($request, $userId);
            $invoices = $query->get();
            $totals = $this->invoiceExportTotals($invoices);

            return ListExport::pdf(
                'invoices',
                'Invoices Report',
                $filterSummary,
                ['Date', 'Bill No.', 'Party', 'Status', 'Net Value', 'IGST', 'Balance'],
                $invoices->map(fn ($invoice) => [
                    ListExport::formatDate($invoice->invoice_date),
                    $invoice->bill_number,
                    $invoice->party?->name ?? '—',
                    ucfirst($invoice->status),
                    ListExport::formatMoney($invoice->net_value),
                    ListExport::formatMoney($invoice->igst_amount),
                    ListExport::formatMoney($invoice->balance_amount),
                ]),
                $invoices->count(),
                [
                    'TOTAL',
                    $invoices->count().' invoices',
                    '',
                    '',
                    ListExport::formatMoney($totals['net_value']),
                    ListExport::formatMoney($totals['igst_amount']),
                    ListExport::formatMoney($totals['balance_amount']),
                ],
                [
                    ['label' => 'Total Net Value', 'value' => '₹ '.ListExport::formatMoney($totals['net_value'])],
                    ['label' => 'Total Balance', 'value' => '₹ '.ListExport::formatMoney($totals['balance_amount'])],
                ],
            );
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
                ->with(['company', 'party', 'lines', 'payments'])
                ->findOrFail($request->input('id'));

            InvoicePaymentCalculator::attachSummariesToInvoices(collect([$invoice]));
            $paymentSummary = InvoicePaymentCalculator::invoiceSummary($invoice);

            return $this->sendJsonResponse(true, 'Invoice loaded.', [
                'invoice' => $invoice,
                'paymentSummary' => $paymentSummary,
                'partySummary' => InvoicePaymentCalculator::partySummary(
                    (int) $request->user()->id,
                    (int) $invoice->party_id,
                ),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postInvoiceDownloadPdf(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => $validation->errors()->first(),
                ], 422);
            }

            $invoice = FreightInvoice::query()
                ->where('user_id', $request->user()->id)
                ->with(['company', 'party', 'lines'])
                ->findOrFail($request->input('id'));

            if (! $invoice->company || ! $invoice->party) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invoice is missing company or party details.',
                ], 422);
            }

            return TaxInvoicePdf::download($invoice);
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

            $validation = Validator::make($request->all(), [
                'party_id' => ['required', 'exists:parties,id'],
                'bill_number' => ['required', 'string', 'max:50', 'unique:freight_invoices,bill_number'],
                'invoice_date' => ['required', 'date'],
                'sac_code' => ['nullable', 'string', 'max:10'],
                'status' => ['required', 'in:draft,finalized'],
                'prepared_by' => ['nullable', 'string', 'max:100'],
                'checked_by' => ['nullable', 'string', 'max:100'],
                'lines' => ['required', 'array', 'min:1'],
                'lines.*.entrybook_id' => ['nullable', 'integer', 'exists:entrybooks,id'],
                'lines.*.entry_number' => ['nullable', 'string', 'max:50'],
                'lines.*.entry_date' => ['nullable', 'date'],
                'lines.*.vehicle_number' => ['nullable', 'string', 'max:20'],
                'lines.*.route_from' => ['nullable', 'string', 'max:255'],
                'lines.*.product_name' => ['nullable', 'string', 'max:255'],
                'lines.*.weight' => ['required', 'numeric', 'min:0'],
                'lines.*.rate' => ['required', 'numeric', 'min:0'],
                'lines.*.advance_paid' => ['nullable', 'numeric', 'min:0'],
                'lines.*.empty_container_charge' => ['nullable', 'numeric', 'min:0'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $validated = $validation->validated();

            $party = Party::query()->find($validated['party_id']);
            if (! $party || $party->user_id !== $request->user()->id) {
                return $this->sendJsonResponse(false, 'Invalid party.', null, 200);
            }

            foreach ($validated['lines'] as $line) {
                if (empty($line['entrybook_id'])) {
                    continue;
                }

                $entrybook = Entrybook::query()->find($line['entrybook_id']);
                if (! $entrybook || $entrybook->user_id !== $request->user()->id) {
                    return $this->sendJsonResponse(false, 'Invalid entrybook entry.', null, 200);
                }

                if ((int) $entrybook->party_id !== (int) $validated['party_id']) {
                    return $this->sendJsonResponse(
                        false,
                        'Entry '.$entrybook->entry_number.' does not belong to the selected party.',
                        null,
                        200,
                    );
                }
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
                'invoice' => $invoice->load(['company', 'party', 'lines']),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postInvoiceUpdate(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
                'party_id' => ['required', 'exists:parties,id'],
                'bill_number' => ['required', 'string', 'max:50', 'unique:freight_invoices,bill_number,'.$request->input('id')],
                'invoice_date' => ['required', 'date'],
                'sac_code' => ['nullable', 'string', 'max:10'],
                'status' => ['required', 'in:draft,finalized'],
                'prepared_by' => ['nullable', 'string', 'max:100'],
                'checked_by' => ['nullable', 'string', 'max:100'],
                'lines' => ['required', 'array', 'min:1'],
                'lines.*.entrybook_id' => ['nullable', 'integer', 'exists:entrybooks,id'],
                'lines.*.entry_number' => ['nullable', 'string', 'max:50'],
                'lines.*.entry_date' => ['nullable', 'date'],
                'lines.*.vehicle_number' => ['nullable', 'string', 'max:20'],
                'lines.*.route_from' => ['nullable', 'string', 'max:255'],
                'lines.*.product_name' => ['nullable', 'string', 'max:255'],
                'lines.*.weight' => ['required', 'numeric', 'min:0'],
                'lines.*.rate' => ['required', 'numeric', 'min:0'],
                'lines.*.advance_paid' => ['nullable', 'numeric', 'min:0'],
                'lines.*.empty_container_charge' => ['nullable', 'numeric', 'min:0'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $validated = $validation->validated();

            $invoice = FreightInvoice::query()
                ->where('user_id', $request->user()->id)
                ->with('company')
                ->findOrFail($validated['id']);

            $company = $invoice->company;

            $party = Party::query()->find($validated['party_id']);
            if (! $party || $party->user_id !== $request->user()->id) {
                return $this->sendJsonResponse(false, 'Invalid party.', null, 200);
            }

            foreach ($validated['lines'] as $line) {
                if (empty($line['entrybook_id'])) {
                    continue;
                }

                $entrybook = Entrybook::query()->find($line['entrybook_id']);
                if (! $entrybook || $entrybook->user_id !== $request->user()->id) {
                    return $this->sendJsonResponse(false, 'Invalid entrybook entry.', null, 200);
                }

                if ((int) $entrybook->party_id !== (int) $validated['party_id']) {
                    return $this->sendJsonResponse(
                        false,
                        'Entry '.$entrybook->entry_number.' does not belong to the selected party.',
                        null,
                        200,
                    );
                }
            }

            $lines = $validated['lines'];
            unset($validated['lines'], $validated['id']);

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
                'invoice' => $invoice->fresh()->load(['company', 'party', 'lines']),
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
            'parties' => $this->partiesForUser($request),
            'vehicles' => Vehicle::query()->forUser($userId)->orderBy('vehicle_number')->get(['id', 'vehicle_number']),
            'routeLocations' => RouteLocation::query()->forUser($userId)->orderBy('name')->get(['id', 'name']),
            'entrybooks' => Entrybook::query()
                ->where('user_id', $userId)
                ->with(['vehicle:id,vehicle_number', 'party:id,name'])
                ->orderByDesc('entry_date')
                ->orderByDesc('id')
                ->get(['id', 'entry_number', 'entry_date', 'vehicle_id', 'party_id', 'route_from', 'freight', 'advance', 'balance']),
            'entrySettings' => [
                'prefix' => $company->entry_number_prefix,
                'nextSequence' => $nextSequence,
            ],
        ];
    }

    /** @return Collection<int, Party> */
    private function partiesForUser(Request $request)
    {
        return Party::query()
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
                'entrybook_id' => $line['entrybook_id'] ?? null,
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

    /**
     * @return array{0: \Illuminate\Database\Eloquent\Builder, 1: string, 2: array<string, string>}
     */
    private function filteredInvoicesQuery(Request $request, int $userId): array
    {
        $dateFilters = ListFilter::dateFromRequest($request);
        $search = ListFilter::searchFromRequest($request);
        $partyId = ListFilter::optionalIdFromRequest($request, 'party_id');
        $status = ListFilter::statusFromRequest($request, ['draft', 'finalized']);
        $paymentValidated = $request->validate([
            'payment_status' => ['nullable', 'string', Rule::in(['paid', 'partial', 'pending'])],
        ]);
        $paymentStatus = $paymentValidated['payment_status'] ?? '';

        $query = FreightInvoice::query()
            ->where('user_id', $userId)
            ->with(['party:id,name', 'company:id,name']);
        ListFilter::applyDate($query, $dateFilters, 'invoice_date');
        ListFilter::applySearch($query, $search, ['bill_number']);
        if ($partyId !== '') {
            $query->where('party_id', $partyId);
        }
        if ($status !== '') {
            $query->where('status', $status);
        }
        InvoicePaymentCalculator::applyPaymentStatusFilter($query, $paymentStatus, $userId);
        $query->orderByDesc('invoice_date')->orderByDesc('id');

        $parties = Party::query()
            ->where('user_id', $userId)
            ->orderBy('name')
            ->get(['id', 'name']);

        $partyName = $partyId !== ''
            ? $parties->firstWhere('id', (int) $partyId)?->name
            : null;

        $filterSummary = ListFilter::summary([
            $search !== '' ? 'Search: '.$search : null,
            $status !== '' ? 'Invoice status: '.ucfirst($status) : null,
            $paymentStatus !== '' ? 'Payment: '.ucfirst($paymentStatus) : null,
            $partyName ? 'Party: '.$partyName : null,
            ListFilter::dateSummary($dateFilters),
        ], 'All invoices');

        return [$query, $filterSummary, [
            'search' => $search,
            'status' => $status,
            'payment_status' => $paymentStatus,
            'party_id' => $partyId,
            ...$dateFilters,
        ]];
    }

    /** @param  Collection<int, FreightInvoice>  $invoices */
    private function invoiceExportTotals(Collection $invoices): array
    {
        return [
            'net_value' => round((float) $invoices->sum('net_value'), 2),
            'igst_amount' => round((float) $invoices->sum('igst_amount'), 2),
            'balance_amount' => round((float) $invoices->sum('balance_amount'), 2),
        ];
    }
}
