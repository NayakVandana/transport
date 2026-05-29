<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Http\Requests\VehicleRequest;
use App\Models\Vehicle;
use App\Support\DocumentValidation;
use App\Support\ListExport;
use App\Support\ListFilter;
use App\Support\VehicleValidation;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VehicleApiController extends Controller
{
    public function postVehiclesList(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $perPage = (int) ($request->input('per_page') ?: 20);
            $currentPage = (int) ($request->input('current_page') ?: 1);
            [$query, $filterSummary, $filters] = $this->filteredVehiclesQuery($request);

            $vehicles = $query->paginate($perPage, ['*'], 'page', $currentPage);

            return $this->sendJsonResponse(true, 'Vehicles loaded.', [
                'vehicles' => $vehicles,
                'filters' => $filters,
                'filterSummary' => $filterSummary,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postVehiclesExportCsv(Request $request): StreamedResponse|JsonResponse
    {
        try {
            [$query, $filterSummary] = $this->filteredVehiclesQuery($request);
            $vehicles = $query->get();

            return ListExport::csv(
                'vehicles',
                'Vehicles Export',
                $filterSummary,
                ['Number', 'Type', 'Brand', 'Model', 'Capacity', 'Fuel', 'Status'],
                $vehicles->map(fn ($vehicle) => [
                    $vehicle->vehicle_number,
                    $vehicle->vehicle_type ?? '',
                    $vehicle->brand ?? '',
                    $vehicle->model ?? '',
                    $vehicle->capacity ?? '',
                    $vehicle->fuel_type ?? '',
                    ucfirst($vehicle->status),
                ]),
                ['TOTAL', $vehicles->count().' vehicles', '', '', '', '', ''],
            );
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postVehiclesExportPdf(Request $request)
    {
        try {
            [$query, $filterSummary] = $this->filteredVehiclesQuery($request);
            $vehicles = $query->get();

            return ListExport::pdf(
                'vehicles',
                'Vehicles Report',
                $filterSummary,
                ['Number', 'Type', 'Brand', 'Model', 'Capacity', 'Fuel', 'Status'],
                $vehicles->map(fn ($vehicle) => [
                    $vehicle->vehicle_number,
                    $vehicle->vehicle_type ?? '—',
                    $vehicle->brand ?? '—',
                    $vehicle->model ?? '—',
                    $vehicle->capacity ?? '—',
                    $vehicle->fuel_type ?? '—',
                    ucfirst($vehicle->status),
                ]),
                $vehicles->count(),
            );
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postVehicleMeta(Request $request)
    {
        try {
            return $this->sendJsonResponse(true, 'Vehicle form data loaded.', [
                'validationMessages' => VehicleValidation::forFrontend(),
                'fuelTypes' => VehicleValidation::fuelTypes(),
                'document_types' => DocumentValidation::vehicleOptionsForFrontend(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postVehicleShow(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $vehicle = Vehicle::query()
                ->with(['documents' => fn ($query) => $query->orderByDesc('created_at')])
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            return $this->sendJsonResponse(true, 'Vehicle loaded.', [
                'vehicle' => $vehicle,
                'validationMessages' => VehicleValidation::forFrontend(),
                'fuelTypes' => VehicleValidation::fuelTypes(),
                'document_types' => DocumentValidation::vehicleOptionsForFrontend(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postVehicleStore(VehicleRequest $request)
    {
        try {
            $vehicle = Vehicle::query()->create([
                ...$request->validated(),
                'user_id' => $request->user()->id,
            ]);

            return $this->sendJsonResponse(true, 'Vehicle saved.', [
                'vehicle' => $vehicle,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postVehicleUpdate(VehicleRequest $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $vehicle = Vehicle::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $vehicle->update($request->validated());

            return $this->sendJsonResponse(true, 'Vehicle updated.', [
                'vehicle' => $vehicle->fresh(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postVehicleDestroy(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $vehicle = Vehicle::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $vehicle->delete();

            return $this->sendJsonResponse(true, 'Vehicle removed.', null, 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    /** @return array{0: \Illuminate\Database\Eloquent\Builder, 1: string, 2: array<string, string>} */
    private function filteredVehiclesQuery(Request $request): array
    {
        $userId = (int) $request->user()->id;
        $dateFilters = ListFilter::dateFromRequest($request);
        $search = ListFilter::searchFromRequest($request);
        $status = ListFilter::statusFromRequest($request, ['active', 'inactive']);

        $query = Vehicle::query()->where('user_id', $userId);
        ListFilter::applySearch($query, $search, ['vehicle_number', 'vehicle_type', 'brand', 'model']);
        ListFilter::applyDate($query, $dateFilters, 'created_at');
        if ($status !== '') {
            $query->where('status', $status);
        }
        $query->orderBy('vehicle_number');

        $filterSummary = ListFilter::summary([
            $search !== '' ? 'Search: '.$search : null,
            $status !== '' ? 'Status: '.ucfirst($status) : null,
            ListFilter::dateSummary($dateFilters),
        ], 'All vehicles');

        return [$query, $filterSummary, [
            'search' => $search,
            'status' => $status,
            ...$dateFilters,
        ]];
    }
}
