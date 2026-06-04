<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\FreightInvoice;
use App\Models\LoadingSlip;
use App\Models\Party;
use App\Models\Vehicle;
use App\Support\AmountInWords;
use App\Support\FreightInvoiceCalculator;
use App\Support\ListFilter;
use App\Support\LoadingSlipPdf;
use App\Support\RoutePairRegistry;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class LoadingSlipApiController extends Controller
{
    public function postLoadingSlipsList(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            [$query, $filterSummary, $filters] = $this->filteredSlipsQuery($request, $userId);
            $perPage = (int) ($request->input('per_page') ?: 15);
            $currentPage = (int) ($request->input('current_page') ?: 1);

            $slips = $query->paginate($perPage, ['*'], 'page', $currentPage);
            $parties = Party::query()
                ->where('user_id', $userId)
                ->orderBy('name')
                ->get(['id', 'name']);

            return $this->sendJsonResponse(true, 'Loading slips loaded.', [
                'loadingSlips' => $slips,
                'parties' => $parties,
                'filters' => $filters,
                'filterSummary' => $filterSummary,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postLoadingSlipMeta(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $company = Company::query()->where('user_id', $userId)->first();

            return $this->sendJsonResponse(true, 'Loading slip form data loaded.', [
                'company' => $company,
                'parties' => $this->partiesForUser($userId),
                'vehicles' => Vehicle::query()->forUser($userId)->orderBy('vehicle_number')->get(['id', 'vehicle_number']),
                'routes' => \App\Models\Location::query()->forUser($userId)->orderBy('name')->get(['id', 'name']),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postLoadingSlipShow(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $userId = (int) $request->user()->id;
            $slip = $this->findSlipForUser($userId, (int) $request->input('id'));

            return $this->sendJsonResponse(true, 'Loading slip loaded.', [
                'loadingSlip' => $slip,
                'company' => Company::query()->where('user_id', $userId)->first(),
                'contactEmail' => $request->user()->email,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postLoadingSlipStore(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $validated = $this->validateSlip($request, $userId);

            if ($validated instanceof JsonResponse) {
                return $validated;
            }

            $lines = $validated['lines'];
            unset($validated['lines']);
            $totals = $this->lineTotals($lines);

            $slip = DB::transaction(function () use ($userId, $validated, $lines, $totals) {
                $slip = LoadingSlip::query()->create([
                    ...$validated,
                    'user_id' => $userId,
                    ...$totals,
                    'status' => 'draft',
                ]);

                $this->syncLines($slip, $lines, $userId);

                return $slip;
            });

            return $this->sendJsonResponse(true, 'Loading slip created.', [
                'loadingSlip' => $this->findSlipForUser($userId, $slip->id),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postLoadingSlipUpdate(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $slip = LoadingSlip::query()
                ->where('user_id', $userId)
                ->findOrFail($request->input('id'));

            if ($slip->freight_invoice_id) {
                return $this->sendJsonResponse(false, 'This loading slip is already invoiced and cannot be edited.', null, 200);
            }

            $validated = $this->validateSlip($request, $userId, (int) $slip->id);

            if ($validated instanceof JsonResponse) {
                return $validated;
            }

            $lines = $validated['lines'];
            unset($validated['lines'], $validated['id']);
            $totals = $this->lineTotals($lines);

            DB::transaction(function () use ($slip, $validated, $lines, $totals, $userId) {
                $slip->update([
                    ...$validated,
                    ...$totals,
                ]);

                $slip->lines()->delete();
                $this->syncLines($slip, $lines, $userId);
            });

            return $this->sendJsonResponse(true, 'Loading slip updated.', [
                'loadingSlip' => $this->findSlipForUser($userId, $slip->id),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postLoadingSlipDestroy(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $slip = LoadingSlip::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            if ($slip->freight_invoice_id) {
                return $this->sendJsonResponse(false, 'Cannot delete a loading slip that has an invoice.', null, 200);
            }

            $slip->delete();

            return $this->sendJsonResponse(true, 'Loading slip deleted.', null, 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postLoadingSlipDownloadPdf(Request $request)
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

            $userId = (int) $request->user()->id;
            $slip = $this->findSlipForUser($userId, (int) $request->input('id'));
            $company = Company::query()->where('user_id', $userId)->first();

            return LoadingSlipPdf::download($slip, $request->user()->email, $company);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postLoadingSlipGenerateInvoice(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
                'bill_number' => ['nullable', 'string', 'max:50', 'unique:freight_invoices,bill_number'],
                'status' => ['nullable', 'in:draft,finalized'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $userId = (int) $request->user()->id;
            $company = Company::query()->where('user_id', $userId)->first();

            if (! $company) {
                return $this->sendJsonResponse(false, 'Set up your company profile before creating invoices.', null, 200);
            }

            $slip = $this->findSlipForUser($userId, (int) $request->input('id'));

            if ($slip->freight_invoice_id) {
                return $this->sendJsonResponse(true, 'Invoice already exists for this loading slip.', [
                    'invoice' => FreightInvoice::query()
                        ->with(['company', 'party', 'lines'])
                        ->find($slip->freight_invoice_id),
                    'loadingSlip' => $slip,
                ], 200);
            }

            if (! $slip->party_id) {
                return $this->sendJsonResponse(false, 'Select a party on the loading slip before generating an invoice.', null, 200);
            }

            if ($slip->lines->isEmpty()) {
                return $this->sendJsonResponse(false, 'Add at least one vehicle line before generating an invoice.', null, 200);
            }

            $billNumber = $request->input('bill_number') ?: $this->suggestBillNumber($userId);
            $invoiceStatus = $request->input('status') ?: 'draft';

            $invoiceLines = $slip->lines->map(function ($line) use ($slip) {
                return [
                    'entry_number' => null,
                    'entry_date' => $slip->loading_date?->toDateString() ?? $slip->slip_date?->toDateString(),
                    'vehicle_number' => $line->vehicle_number,
                    'route_from' => $slip->route_from,
                    'route_to' => $line->destination ?: $slip->route_to,
                    'product_name' => 'AS PER INVOICES',
                    'weight' => 1,
                    'rate' => (float) $line->freight_rate,
                    'advance_paid' => (float) $line->advance,
                    'empty_container_charge' => 0,
                    'detention' => 0,
                    'weightman' => 0,
                    'parking' => 0,
                ];
            })->all();

            [$totals, $lineFreights] = FreightInvoiceCalculator::forPersistence(
                $invoiceLines,
                (float) $company->igst_rate,
            );

            $invoice = DB::transaction(function () use (
                $userId,
                $company,
                $slip,
                $billNumber,
                $invoiceStatus,
                $invoiceLines,
                $totals,
                $lineFreights,
            ) {
                $invoice = FreightInvoice::query()->create([
                    'user_id' => $userId,
                    'company_id' => $company->id,
                    'party_id' => $slip->party_id,
                    'bill_number' => $billNumber,
                    'invoice_date' => $slip->slip_date,
                    'sac_code' => $company->sac_code,
                    'status' => $invoiceStatus,
                    'igst_rate' => $company->igst_rate,
                    ...$totals,
                    'balance_in_words' => AmountInWords::rupees($totals['balance_amount']),
                ]);

                foreach ($invoiceLines as $index => $line) {
                    $routeFrom = isset($line['route_from']) ? trim((string) $line['route_from']) : '';
                    $routeTo = isset($line['route_to']) ? trim((string) $line['route_to']) : '';

                    if ($routeFrom !== '' && $routeTo !== '') {
                        $pair = RoutePairRegistry::registerTripLocations($userId, $routeFrom, $routeTo);
                        $routeFrom = $pair['from'];
                        $routeTo = $pair['to'];
                    }

                    $invoice->lines()->create([
                        'serial_number' => $index + 1,
                        'entry_number' => $line['entry_number'] ?? null,
                        'entry_date' => $line['entry_date'] ?? null,
                        'vehicle_number' => $line['vehicle_number'] ?? null,
                        'route_from' => $routeFrom !== '' ? $routeFrom : null,
                        'route_to' => $routeTo !== '' ? $routeTo : null,
                        'product_name' => $line['product_name'] ?? null,
                        'weight' => $line['weight'] ?? 1,
                        'rate' => $line['rate'] ?? 0,
                        'freight' => $lineFreights[$index] ?? 0,
                        'advance_paid' => $line['advance_paid'] ?? 0,
                        'empty_container_charge' => $line['empty_container_charge'] ?? 0,
                        'detention' => $line['detention'] ?? 0,
                        'weightman' => $line['weightman'] ?? 0,
                        'parking' => $line['parking'] ?? 0,
                    ]);
                }

                $slip->update([
                    'freight_invoice_id' => $invoice->id,
                    'status' => 'invoiced',
                ]);

                return $invoice;
            });

            return $this->sendJsonResponse(true, 'Invoice generated from loading slip.', [
                'invoice' => $invoice->load(['company', 'party', 'lines']),
                'loadingSlip' => $this->findSlipForUser($userId, $slip->id),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    private function findSlipForUser(int $userId, int $id): LoadingSlip
    {
        return LoadingSlip::query()
            ->where('user_id', $userId)
            ->with([
                'party:id,name',
                'freightInvoice:id,bill_number,balance_amount,status',
                'lines' => fn ($query) => $query->orderBy('serial_number'),
                'lines.vehicle:id,vehicle_number',
            ])
            ->findOrFail($id);
    }

    /** @return array<string, mixed>|JsonResponse */
    private function validateSlip(Request $request, int $userId, ?int $slipId = null)
    {
        $validation = Validator::make($request->all(), [
            'id' => ['nullable', 'integer'],
            'party_id' => ['nullable', 'exists:parties,id'],
            'slip_date' => ['required', 'date'],
            'loading_date' => ['nullable', 'date'],
            'route_from' => ['nullable', 'string', 'max:255'],
            'route_to' => ['nullable', 'string', 'max:255'],
            'authorized_signatory' => ['nullable', 'string', 'max:100'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.vehicle_id' => ['nullable', 'integer', 'exists:vehicles,id'],
            'lines.*.vehicle_number' => ['nullable', 'string', 'max:20'],
            'lines.*.destination' => ['nullable', 'string', 'max:255'],
            'lines.*.freight_rate' => ['required', 'numeric', 'min:0'],
            'lines.*.advance' => ['nullable', 'numeric', 'min:0'],
        ]);

        if ($validation->fails()) {
            return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
        }

        $validated = $validation->validated();

        if (! empty($validated['party_id'])) {
            $party = Party::query()->find($validated['party_id']);
            if (! $party || $party->user_id !== $userId) {
                return $this->sendJsonResponse(false, 'Invalid party.', null, 200);
            }
        }

        foreach ($validated['lines'] as $index => $line) {
            if (empty($line['vehicle_id']) && empty(trim((string) ($line['vehicle_number'] ?? '')))) {
                return $this->sendJsonResponse(false, 'Vehicle is required on line '.($index + 1).'.', null, 200);
            }

            if (! empty($line['vehicle_id'])) {
                $vehicle = Vehicle::query()->find($line['vehicle_id']);
                if (! $vehicle || (int) $vehicle->user_id !== $userId) {
                    return $this->sendJsonResponse(false, 'Invalid vehicle on line '.($index + 1).'.', null, 200);
                }
            }
        }

        if ($slipId !== null) {
            $validated['id'] = $slipId;
        }

        return $validated;
    }

    /** @param  list<array<string, mixed>>  $lines */
    private function lineTotals(array $lines): array
    {
        $totalFreight = 0.0;
        $totalAdvance = 0.0;

        foreach ($lines as $line) {
            $totalFreight += (float) ($line['freight_rate'] ?? 0);
            $totalAdvance += (float) ($line['advance'] ?? 0);
        }

        $totalBalance = round($totalFreight - $totalAdvance, 2);

        return [
            'total_freight' => round($totalFreight, 2),
            'total_advance' => round($totalAdvance, 2),
            'total_balance' => $totalBalance,
        ];
    }

    /** @param  list<array<string, mixed>>  $lines */
    private function syncLines(LoadingSlip $slip, array $lines, int $userId): void
    {
        foreach ($lines as $index => $line) {
            $vehicleNumber = trim((string) ($line['vehicle_number'] ?? ''));
            $vehicleId = $line['vehicle_id'] ?? null;

            if ($vehicleId) {
                $vehicle = Vehicle::query()->find($vehicleId);
                if ($vehicle && (int) $vehicle->user_id === $userId) {
                    $vehicleNumber = $vehicle->vehicle_number;
                }
            }

            $freight = (float) ($line['freight_rate'] ?? 0);
            $advance = (float) ($line['advance'] ?? 0);

            $destination = isset($line['destination']) ? trim((string) $line['destination']) : '';
            if ($destination !== '' && $slip->route_from) {
                RoutePairRegistry::registerTripLocations($userId, $slip->route_from, $destination);
            }

            $slip->lines()->create([
                'serial_number' => $index + 1,
                'vehicle_id' => $vehicleId ?: null,
                'vehicle_number' => $vehicleNumber !== '' ? $vehicleNumber : null,
                'destination' => $destination !== '' ? strtoupper($destination) : null,
                'freight_rate' => $freight,
                'advance' => $advance,
                'balance' => round($freight - $advance, 2),
            ]);
        }

        if ($slip->route_from && $slip->route_to) {
            RoutePairRegistry::registerTripLocations($userId, $slip->route_from, $slip->route_to);
        }
    }

    /** @return \Illuminate\Database\Eloquent\Collection<int, Party> */
    private function partiesForUser(int $userId)
    {
        return Party::query()
            ->where('user_id', $userId)
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    private function suggestBillNumber(int $userId): string
    {
        $year = now()->format('y');
        $prefix = 'R'.now()->format('y').(now()->month >= 4 ? now()->addYear()->format('y') : $year);

        $last = FreightInvoice::query()
            ->where('user_id', $userId)
            ->where('bill_number', 'like', $prefix.'-%')
            ->orderByDesc('bill_number')
            ->value('bill_number');

        $seq = 1;
        if ($last && preg_match('/-(\d+)$/', $last, $m)) {
            $seq = (int) $m[1] + 1;
        }

        return sprintf('%s-%04d', $prefix, $seq);
    }

    /**
     * @return array{0: \Illuminate\Database\Eloquent\Builder, 1: string, 2: array<string, string>}
     */
    private function filteredSlipsQuery(Request $request, int $userId): array
    {
        $dateFilters = ListFilter::dateFromRequest($request);
        $search = ListFilter::searchFromRequest($request);
        $partyId = ListFilter::optionalIdFromRequest($request, 'party_id');
        $status = ListFilter::statusFromRequest($request, ['draft', 'invoiced']);

        $query = LoadingSlip::query()
            ->where('user_id', $userId)
            ->with([
                'party:id,name',
                'freightInvoice:id,bill_number',
            ]);
        ListFilter::applyDate($query, $dateFilters, 'slip_date');
        ListFilter::applySearch($query, $search, ['route_from', 'route_to']);
        if ($partyId !== '') {
            $query->where('party_id', $partyId);
        }
        if ($status !== '') {
            $query->where('status', $status);
        }
        $query->orderByDesc('slip_date')->orderByDesc('id');

        $parties = Party::query()
            ->where('user_id', $userId)
            ->orderBy('name')
            ->get(['id', 'name']);

        $partyName = $partyId !== ''
            ? $parties->firstWhere('id', (int) $partyId)?->name
            : null;

        $filterSummary = ListFilter::summary([
            $search !== '' ? 'Search: '.$search : null,
            $status !== '' ? 'Status: '.ucfirst($status) : null,
            $partyName ? 'Party: '.$partyName : null,
            ListFilter::dateSummary($dateFilters),
        ], 'All loading slips');

        return [$query, $filterSummary, [
            'search' => $search,
            'status' => $status,
            'party_id' => $partyId,
            ...$dateFilters,
        ]];
    }
}
