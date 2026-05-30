<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Http\Requests\EntrybookRequest;
use App\Models\Entrybook;
use App\Support\EntrybookCalculator;
use App\Support\EntrybookReport;
use App\Support\EntrybookValidation;
use App\Support\EntryNumberGenerator;
use App\Support\ListExport;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EntrybookApiController extends Controller
{
    public function postEntrybooksList(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $filters = EntrybookReport::filtersFromRequest($request, $userId);
            $vehicles = EntrybookReport::vehiclesForUser($userId);
            $routes = EntrybookReport::routesForUser($userId);
            $query = EntrybookReport::filteredQuery($userId, $filters);
            $perPage = (int) ($request->input('per_page') ?: 20);
            $currentPage = (int) ($request->input('current_page') ?: 1);

            $paginator = (clone $query)->paginate($perPage, ['*'], 'page', $currentPage);

            return $this->sendJsonResponse(true, 'Entrybook loaded.', [
                'entrybooks' => $paginator,
                'vehicles' => $vehicles,
                'routes' => $routes,
                'filters' => $filters,
                'totals' => EntrybookReport::totals($query),
                'filterSummary' => EntrybookReport::filterSummary($filters, $vehicles, $routes),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postEntrybookMeta(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $nextSequence = EntryNumberGenerator::resolveEntrybookSequence($userId);

            return $this->sendJsonResponse(true, 'Entrybook form data loaded.', [
                'vehicles' => EntrybookReport::vehiclesForUser($userId),
                'routes' => EntrybookReport::routesForUser($userId),
                'validationMessages' => EntrybookValidation::forFrontend(),
                'nextEntryNumber' => EntryNumberGenerator::formatEntrybookNumber($nextSequence),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postEntrybookShow(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $userId = (int) $request->user()->id;
            $entrybook = Entrybook::query()
                ->with(['vehicle:id,vehicle_number'])
                ->where('user_id', $userId)
                ->findOrFail($request->input('id'));

            return $this->sendJsonResponse(true, 'Entry loaded.', [
                'entrybook' => $entrybook,
                'vehicles' => EntrybookReport::vehiclesForUser($userId),
                'routes' => EntrybookReport::routesForUser($userId),
                'validationMessages' => EntrybookValidation::forFrontend(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postEntrybookStore(EntrybookRequest $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $sequence = EntryNumberGenerator::resolveEntrybookSequence($userId);
            $entryNumber = EntryNumberGenerator::formatEntrybookNumber($sequence);

            $entrybook = Entrybook::query()->create([
                ...$this->payload($request),
                'entry_number' => $entryNumber,
                'user_id' => $userId,
            ]);

            return $this->sendJsonResponse(true, 'Entry saved.', [
                'entrybook' => $entrybook->load(['vehicle:id,vehicle_number']),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postEntrybookUpdate(EntrybookRequest $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $userId = (int) $request->user()->id;
            $entrybook = Entrybook::query()
                ->where('user_id', $userId)
                ->findOrFail($request->input('id'));

            $entrybook->update($this->payload($request));

            return $this->sendJsonResponse(true, 'Entry updated.', [
                'entrybook' => $entrybook->fresh()->load(['vehicle:id,vehicle_number']),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postEntrybookDestroy(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $entrybook = Entrybook::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $entrybook->delete();

            return $this->sendJsonResponse(true, 'Entry removed.', null, 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postEntrybooksExportCsv(Request $request): StreamedResponse|JsonResponse
    {
        try {
            $userId = (int) $request->user()->id;
            $filters = EntrybookReport::filtersFromRequest($request, $userId);
            $vehicles = EntrybookReport::vehiclesForUser($userId);
            $routes = EntrybookReport::routesForUser($userId);
            $query = EntrybookReport::filteredQuery($userId, $filters);
            $entries = $query->get();
            $totals = EntrybookReport::totals($query);
            $filterSummary = EntrybookReport::filterSummary($filters, $vehicles, $routes);

            return ListExport::csv(
                'entrybook',
                'Entrybook Export',
                $filterSummary,
                ['Entry No.', 'Date', 'Vehicle', 'From', 'Freight', 'Advance', 'Balance'],
                $entries->map(fn ($entry) => [
                    $entry->entry_number,
                    ListExport::formatDate($entry->entry_date),
                    $entry->vehicle?->vehicle_number ?? '',
                    $entry->route_from ?? '',
                    $entry->freight,
                    $entry->advance,
                    $entry->balance,
                ]),
                [
                    'TOTAL',
                    $totals['count'].' entries',
                    '',
                    '',
                    ListExport::formatMoney($totals['freight']),
                    ListExport::formatMoney($totals['advance']),
                    ListExport::formatMoney($totals['balance']),
                ],
            );
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postEntrybooksExportPdf(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $filters = EntrybookReport::filtersFromRequest($request, $userId);
            $vehicles = EntrybookReport::vehiclesForUser($userId);
            $routes = EntrybookReport::routesForUser($userId);
            $query = EntrybookReport::filteredQuery($userId, $filters);
            $entries = $query->get();
            $totals = EntrybookReport::totals($query);
            $filterSummary = EntrybookReport::filterSummary($filters, $vehicles, $routes);

            return ListExport::pdf(
                'entrybook',
                'Entrybook Report',
                $filterSummary,
                ['Entry No.', 'Date', 'Vehicle', 'From', 'Freight', 'Advance', 'Balance'],
                $entries->map(fn ($entry) => [
                    $entry->entry_number,
                    ListExport::formatDate($entry->entry_date),
                    $entry->vehicle?->vehicle_number ?? '—',
                    $entry->route_from ?? '—',
                    ListExport::formatMoney($entry->freight),
                    ListExport::formatMoney($entry->advance),
                    ListExport::formatMoney($entry->balance),
                ]),
                $entries->count(),
                [
                    'TOTAL',
                    $totals['count'].' entries',
                    '',
                    '',
                    ListExport::formatMoney($totals['freight']),
                    ListExport::formatMoney($totals['advance']),
                    ListExport::formatMoney($totals['balance']),
                ],
                [
                    ['label' => 'Total Freight', 'value' => '₹ '.ListExport::formatMoney($totals['freight'])],
                    ['label' => 'Total Balance', 'value' => '₹ '.ListExport::formatMoney($totals['balance'])],
                ],
            );
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    /** @return array<string, mixed> */
    private function payload(EntrybookRequest $request): array
    {
        $validated = $request->validated();
        $freight = (float) $validated['freight'];
        $advance = (float) ($validated['advance'] ?? 0);

        return [
            ...$validated,
            'advance' => $advance,
            'balance' => EntrybookCalculator::balance($freight, $advance),
        ];
    }
}
