<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\LoadingSlip;
use App\Models\Location;
use App\Models\Party;
use App\Models\Vehicle;
use App\Support\ListFilter;
use App\Support\LoadingSlipPdf;
use App\Support\RoutePairRegistry;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use InvalidArgumentException;

class LoadingSlipApiController extends Controller
{
    public function postLoadingSlipsList(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            [$query, $filterSummary, $filters] = $this->filteredSlipsQuery($request, $userId);
            $perPage = (int) ($request->input('per_page') ?: 15);
            $currentPage = (int) ($request->input('current_page') ?: 1);

            return $this->sendJsonResponse(true, 'Loading slips loaded.', [
                'loadingSlips' => $query->paginate($perPage, ['*'], 'page', $currentPage),
                'parties' => Party::query()->where('user_id', $userId)->orderBy('name')->get(['id', 'name']),
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

            return $this->sendJsonResponse(true, 'Loading slip form data loaded.', [
                'parties' => Party::query()->where('user_id', $userId)->orderBy('name')->get(['id', 'name']),
                'vehicles' => Vehicle::query()->forUser($userId)->orderBy('vehicle_number')->get(['id', 'vehicle_number']),
                'routes' => Location::query()->forUser($userId)->orderBy('name')->get(['id', 'name']),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postLoadingSlipShow(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), ['id' => ['required', 'integer']]);
            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $userId = (int) $request->user()->id;

            return $this->sendJsonResponse(true, 'Loading slip loaded.', [
                'loadingSlip' => $this->findSlipForUser($userId, (int) $request->input('id')),
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
            $validation = Validator::make($request->all(), ['id' => ['required', 'integer']]);
            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $slip = LoadingSlip::query()->where('user_id', $userId)->findOrFail($request->input('id'));
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
                $slip->update([...$validated, ...$totals]);
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
            $validation = Validator::make($request->all(), ['id' => ['required', 'integer']]);
            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $slip = LoadingSlip::query()->where('user_id', $request->user()->id)->findOrFail($request->input('id'));
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
            $validation = Validator::make($request->all(), ['id' => ['required', 'integer']]);
            if ($validation->fails()) {
                return response()->json(['success' => false, 'message' => $validation->errors()->first()], 422);
            }

            $userId = (int) $request->user()->id;
            $slip = $this->findSlipForUser($userId, (int) $request->input('id'));
            $company = Company::query()->where('user_id', $userId)->first();

            return LoadingSlipPdf::download($slip, $request->user()->email, $company);
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
                'lines' => fn ($q) => $q->orderBy('serial_number'),
                'lines.vehicle:id,vehicle_number',
            ])
            ->findOrFail($id);
    }

    /** @return array<string, mixed>|JsonResponse */
    private function validateSlip(Request $request, int $userId, ?int $slipId = null)
    {
        $validation = Validator::make($request->all(), [
            'party_id' => ['nullable', 'exists:parties,id'],
            'slip_date' => ['required', 'date'],
            'loading_date' => ['nullable', 'date'],
            'route_from' => ['required', 'string', 'max:255'],
            'route_to' => ['required', 'string', 'max:255'],
            'authorized_signatory' => ['nullable', 'string', 'max:100'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.vehicle_id' => ['nullable', 'integer', 'exists:vehicles,id'],
            'lines.*.vehicle_number' => ['nullable', 'string', 'max:20'],
            'lines.*.destination' => ['required', 'string', 'max:255'],
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

        $seenVehicleIds = [];
        foreach ($validated['lines'] as $index => $line) {
            $vehicleId = $line['vehicle_id'] ?? null;
            if (! $vehicleId) {
                continue;
            }
            if (isset($seenVehicleIds[$vehicleId])) {
                return $this->sendJsonResponse(false, 'Each vehicle can only be used once.', [
                    "lines.{$index}.vehicle_id" => ['This vehicle is already used on another line.'],
                ], 200);
            }
            $seenVehicleIds[$vehicleId] = $index;
        }

        $routeError = $this->applyRoutePair($userId, $validated);
        if ($routeError instanceof JsonResponse) {
            return $routeError;
        }

        foreach ($validated['lines'] as $index => $line) {
            $destination = trim((string) ($line['destination'] ?? ''));
            if ($destination === '') {
                return $this->sendJsonResponse(false, 'Destination is required on line '.($index + 1).'.', [
                    "lines.{$index}.destination" => ['Destination is required.'],
                ], 200);
            }
            if (strcasecmp(
                RoutePairRegistry::normalize($validated['route_from']),
                RoutePairRegistry::normalize($destination)
            ) === 0) {
                return $this->sendJsonResponse(false, 'Destination must be different from the from route on line '.($index + 1).'.', [
                    "lines.{$index}.destination" => ['Destination must be different from the from route.'],
                ], 200);
            }
            if (strcasecmp(
                RoutePairRegistry::normalize($validated['route_to']),
                RoutePairRegistry::normalize($destination)
            ) === 0) {
                return $this->sendJsonResponse(false, 'Destination must be different from the to route on line '.($index + 1).'.', [
                    "lines.{$index}.destination" => ['Destination must be different from the to route.'],
                ], 200);
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

        return [
            'total_freight' => round($totalFreight, 2),
            'total_advance' => round($totalAdvance, 2),
            'total_balance' => round($totalFreight - $totalAdvance, 2),
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
            $destination = trim((string) ($line['destination'] ?? ''));
            if ($destination !== '') {
                RoutePairRegistry::ensureLocation($userId, $destination);
                if (
                    $slip->route_from
                    && strcasecmp(
                        RoutePairRegistry::normalize($slip->route_from),
                        RoutePairRegistry::normalize($destination)
                    ) !== 0
                ) {
                    RoutePairRegistry::registerTripLocations($userId, $slip->route_from, $destination);
                }
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

    /** @param  array<string, mixed>  $validated */
    private function applyRoutePair(int $userId, array &$validated): ?JsonResponse
    {
        try {
            $pair = RoutePairRegistry::validatedPair(
                (string) ($validated['route_from'] ?? ''),
                (string) ($validated['route_to'] ?? ''),
            );
            RoutePairRegistry::registerTripLocations($userId, $pair['from'], $pair['to']);
            $validated['route_from'] = $pair['from'];
            $validated['route_to'] = $pair['to'];
        } catch (InvalidArgumentException $e) {
            return $this->sendJsonResponse(false, $e->getMessage(), [
                'route_from' => [$e->getMessage()],
                'route_to' => [$e->getMessage()],
            ], 200);
        }

        return null;
    }

    /** @return array{0: \Illuminate\Database\Eloquent\Builder, 1: string, 2: array<string, string>} */
    private function filteredSlipsQuery(Request $request, int $userId): array
    {
        $dateFilters = ListFilter::dateFromRequest($request);
        $search = ListFilter::searchFromRequest($request);
        $partyId = ListFilter::optionalIdFromRequest($request, 'party_id');
        $status = ListFilter::statusFromRequest($request, ['draft', 'invoiced']);

        $query = LoadingSlip::query()
            ->where('user_id', $userId)
            ->with(['party:id,name', 'freightInvoice:id,bill_number']);
        ListFilter::applyDate($query, $dateFilters, 'slip_date');
        ListFilter::applySearch($query, $search, ['route_from', 'route_to']);
        if ($partyId !== '') {
            $query->where('party_id', $partyId);
        }
        if ($status !== '') {
            $query->where('status', $status);
        }
        $query->orderByDesc('slip_date')->orderByDesc('id');

        $parties = Party::query()->where('user_id', $userId)->orderBy('name')->get(['id', 'name']);
        $partyName = $partyId !== '' ? $parties->firstWhere('id', (int) $partyId)?->name : null;

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
