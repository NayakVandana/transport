<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Http\Requests\VehicleExpenseRequest;
use App\Models\VehicleExpense;
use App\Support\ListExport;
use App\Support\VehicleExpenseCalculator;
use App\Support\VehicleExpenseReport;
use App\Support\VehicleExpenseValidation;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VehicleExpenseApiController extends Controller
{
    public function postVehicleExpensesList(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $filters = VehicleExpenseReport::filtersFromRequest($request, $userId);
            $vehicles = VehicleExpenseReport::vehiclesForUser($userId);
            $query = VehicleExpenseReport::filteredQuery($userId, $filters);
            $perPage = (int) ($request->input('per_page') ?: 20);
            $currentPage = (int) ($request->input('current_page') ?: 1);

            $paginator = (clone $query)->paginate($perPage, ['*'], 'page', $currentPage);

            return $this->sendJsonResponse(true, 'Vehicle expenses loaded.', [
                'vehicleExpenses' => $paginator,
                'vehicles' => $vehicles,
                'filters' => $filters,
                'totals' => VehicleExpenseReport::totals($query),
                'filterSummary' => VehicleExpenseReport::filterSummary($filters, $vehicles),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postVehicleExpenseMeta(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;

            return $this->sendJsonResponse(true, 'Vehicle expense form data loaded.', [
                'vehicles' => VehicleExpenseReport::vehiclesForUser($userId),
                'validationMessages' => VehicleExpenseValidation::forFrontend(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postVehicleExpenseShow(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $userId = (int) $request->user()->id;
            $vehicleExpense = VehicleExpense::query()
                ->with(['vehicle:id,vehicle_number'])
                ->where('user_id', $userId)
                ->findOrFail($request->input('id'));

            return $this->sendJsonResponse(true, 'Vehicle expense loaded.', [
                'vehicleExpense' => $vehicleExpense,
                'vehicles' => VehicleExpenseReport::vehiclesForUser($userId),
                'validationMessages' => VehicleExpenseValidation::forFrontend(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postVehicleExpenseStore(VehicleExpenseRequest $request)
    {
        try {
            $vehicleExpense = VehicleExpense::query()->create([
                ...$this->payload($request),
                'user_id' => (int) $request->user()->id,
            ]);

            return $this->sendJsonResponse(true, 'Vehicle expense saved.', [
                'vehicleExpense' => $vehicleExpense->load(['vehicle:id,vehicle_number']),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postVehicleExpenseUpdate(VehicleExpenseRequest $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $userId = (int) $request->user()->id;
            $vehicleExpense = VehicleExpense::query()
                ->where('user_id', $userId)
                ->findOrFail($request->input('id'));

            $vehicleExpense->update($this->payload($request));

            return $this->sendJsonResponse(true, 'Vehicle expense updated.', [
                'vehicleExpense' => $vehicleExpense->fresh()->load(['vehicle:id,vehicle_number']),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postVehicleExpenseDestroy(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $vehicleExpense = VehicleExpense::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $vehicleExpense->delete();

            return $this->sendJsonResponse(true, 'Vehicle expense removed.', null, 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postVehicleExpensesExportCsv(Request $request): StreamedResponse|JsonResponse
    {
        try {
            $userId = (int) $request->user()->id;
            $filters = VehicleExpenseReport::filtersFromRequest($request, $userId);
            $vehicles = VehicleExpenseReport::vehiclesForUser($userId);
            $query = VehicleExpenseReport::filteredQuery($userId, $filters);
            $rows = $query->get();
            $totals = VehicleExpenseReport::totals($query);
            $filterSummary = VehicleExpenseReport::filterSummary($filters, $vehicles);

            return ListExport::csv(
                'vehicle-expenses',
                'Vehicle Expenses Export',
                $filterSummary,
                ['Date', 'Vehicle', 'Freight', 'Advance', 'Empty', 'Toll', 'Maintenance', 'Balance'],
                $rows->map(fn ($row) => [
                    ListExport::formatDate($row->expense_date),
                    $row->vehicle?->vehicle_number ?? '',
                    $row->freight,
                    $row->advance,
                    $row->empty_charge,
                    $row->toll,
                    $row->maintenance,
                    $row->balance,
                ]),
                [
                    'TOTAL',
                    $totals['count'].' records',
                    ListExport::formatMoney($totals['freight']),
                    ListExport::formatMoney($totals['advance']),
                    ListExport::formatMoney($totals['empty_charge']),
                    ListExport::formatMoney($totals['toll']),
                    ListExport::formatMoney($totals['maintenance']),
                    ListExport::formatMoney($totals['balance']),
                ],
            );
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postVehicleExpensesExportPdf(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $filters = VehicleExpenseReport::filtersFromRequest($request, $userId);
            $vehicles = VehicleExpenseReport::vehiclesForUser($userId);
            $query = VehicleExpenseReport::filteredQuery($userId, $filters);
            $rows = $query->get();
            $totals = VehicleExpenseReport::totals($query);
            $filterSummary = VehicleExpenseReport::filterSummary($filters, $vehicles);

            return ListExport::pdf(
                'vehicle-expenses',
                'Vehicle Expenses Report',
                $filterSummary,
                ['Date', 'Vehicle', 'Freight', 'Advance', 'Empty', 'Toll', 'Maintenance', 'Balance'],
                $rows->map(fn ($row) => [
                    ListExport::formatDate($row->expense_date),
                    $row->vehicle?->vehicle_number ?? '—',
                    ListExport::formatMoney($row->freight),
                    ListExport::formatMoney($row->advance),
                    ListExport::formatMoney($row->empty_charge),
                    ListExport::formatMoney($row->toll),
                    ListExport::formatMoney($row->maintenance),
                    ListExport::formatMoney($row->balance),
                ]),
                $rows->count(),
                [
                    'TOTAL',
                    $totals['count'].' records',
                    ListExport::formatMoney($totals['freight']),
                    ListExport::formatMoney($totals['advance']),
                    ListExport::formatMoney($totals['empty_charge']),
                    ListExport::formatMoney($totals['toll']),
                    ListExport::formatMoney($totals['maintenance']),
                    ListExport::formatMoney($totals['balance']),
                ],
                [
                    ['label' => 'Total Balance', 'value' => '₹ '.ListExport::formatMoney($totals['balance'])],
                ],
            );
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    /** @return array<string, mixed> */
    private function payload(VehicleExpenseRequest $request): array
    {
        $validated = $request->validated();
        $freight = (float) $validated['freight'];
        $advance = (float) ($validated['advance'] ?? 0);
        $emptyCharge = (float) ($validated['empty_charge'] ?? 0);
        $toll = (float) ($validated['toll'] ?? 0);
        $maintenance = (float) ($validated['maintenance'] ?? 0);

        return [
            ...$validated,
            'advance' => $advance,
            'empty_charge' => $emptyCharge,
            'toll' => $toll,
            'maintenance' => $maintenance,
            'balance' => VehicleExpenseCalculator::balance($freight, $advance, $emptyCharge, $toll, $maintenance),
        ];
    }
}
