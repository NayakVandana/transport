<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Support\DocumentValidation;
use App\Support\ListExport;
use App\Support\ListFilter;
use App\Support\VehicleValidation;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
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
                ['Number', 'Type', 'Brand', 'Model', 'Capacity', 'Fuel', 'Insurance Expiry', 'Permit Expiry', 'PUC Expiry', 'Fitness Expiry', 'Tax', 'Tax Expiry', 'Status'],
                $vehicles->map(fn ($vehicle) => [
                    $vehicle->vehicle_number,
                    $vehicle->vehicle_type ?? '',
                    $vehicle->brand ?? '',
                    $vehicle->model ?? '',
                    $vehicle->capacity ?? '',
                    $vehicle->fuel_type ?? '',
                    ListExport::formatDate($vehicle->insurance_expiry),
                    ListExport::formatDate($vehicle->permit_expiry),
                    ListExport::formatDate($vehicle->pollution_expiry),
                    ListExport::formatDate($vehicle->fitness_expiry),
                    $vehicle->tax_name ?? '',
                    ListExport::formatDate($vehicle->tax_expiry),
                    ucfirst($vehicle->status),
                ]),
                ['TOTAL', $vehicles->count().' vehicles', '', '', '', '', '', '', '', '', '', '', ''],
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
                ['Number', 'Type', 'Brand', 'Model', 'Capacity', 'Fuel', 'Insurance', 'Permit', 'PUC', 'Fitness', 'Tax', 'Tax Expiry', 'Status'],
                $vehicles->map(fn ($vehicle) => [
                    $vehicle->vehicle_number,
                    $vehicle->vehicle_type ?? '—',
                    $vehicle->brand ?? '—',
                    $vehicle->model ?? '—',
                    $vehicle->capacity ?? '—',
                    $vehicle->fuel_type ?? '—',
                    ListExport::formatDate($vehicle->insurance_expiry) ?: '—',
                    ListExport::formatDate($vehicle->permit_expiry) ?: '—',
                    ListExport::formatDate($vehicle->pollution_expiry) ?: '—',
                    ListExport::formatDate($vehicle->fitness_expiry) ?: '—',
                    $vehicle->tax_name ?? '—',
                    ListExport::formatDate($vehicle->tax_expiry) ?: '—',
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
                'taxNames' => VehicleValidation::taxNames(),
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
                'taxNames' => VehicleValidation::taxNames(),
                'document_types' => DocumentValidation::vehicleOptionsForFrontend(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postVehicleStore(Request $request)
    {
        try {
            if ($request->has('vehicle_number')) {
                $request->merge([
                    'vehicle_number' => strtoupper(trim((string) $request->vehicle_number)),
                ]);
            }

            $validation = Validator::make($request->all(), [
                'vehicle_number' => [
                    'required',
                    'string',
                    'max:20',
                    Rule::unique('vehicles', 'vehicle_number')
                        ->where(fn ($query) => $query
                            ->where('user_id', $request->user()->id)
                            ->whereNull('deleted_at')),
                ],
                'vehicle_type' => ['required', 'string', 'max:100'],
                'brand' => ['required', 'string', 'max:100'],
                'model' => ['required', 'string', 'max:100'],
                'capacity' => ['nullable', 'string', 'max:50'],
                'fuel_type' => ['required', 'string', Rule::in(VehicleValidation::fuelTypes())],
                'insurance_number' => ['required', 'string', 'max:50'],
                'insurance_expiry' => ['required', 'date'],
                'permit_number' => ['required', 'string', 'max:50'],
                'permit_expiry' => ['required', 'date'],
                'pollution_expiry' => ['required', 'date'],
                'fitness_expiry' => ['required', 'date'],
                'tax_name' => ['nullable', 'string', 'max:100', 'required_with:tax_expiry'],
                'tax_expiry' => ['nullable', 'date', 'required_with:tax_name'],
                'status' => ['required', 'string', 'in:active,inactive'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $vehicle = Vehicle::query()->create([
                ...$validation->validated(),
                'user_id' => $request->user()->id,
            ]);

            return $this->sendJsonResponse(true, 'Vehicle saved.', [
                'vehicle' => $vehicle,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postVehicleUpdate(Request $request)
    {
        try {
            if ($request->has('vehicle_number')) {
                $request->merge([
                    'vehicle_number' => strtoupper(trim((string) $request->vehicle_number)),
                ]);
            }

            $vehicleId = $request->integer('id') ?: null;

            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
                'vehicle_number' => [
                    'required',
                    'string',
                    'max:20',
                    Rule::unique('vehicles', 'vehicle_number')
                        ->where(fn ($query) => $query
                            ->where('user_id', $request->user()->id)
                            ->whereNull('deleted_at'))
                        ->ignore($vehicleId),
                ],
                'vehicle_type' => ['required', 'string', 'max:100'],
                'brand' => ['required', 'string', 'max:100'],
                'model' => ['required', 'string', 'max:100'],
                'capacity' => ['nullable', 'string', 'max:50'],
                'fuel_type' => ['required', 'string', Rule::in(VehicleValidation::fuelTypes())],
                'insurance_number' => ['required', 'string', 'max:50'],
                'insurance_expiry' => ['required', 'date'],
                'permit_number' => ['required', 'string', 'max:50'],
                'permit_expiry' => ['required', 'date'],
                'pollution_expiry' => ['required', 'date'],
                'fitness_expiry' => ['required', 'date'],
                'tax_name' => ['nullable', 'string', 'max:100', 'required_with:tax_expiry'],
                'tax_expiry' => ['nullable', 'date', 'required_with:tax_name'],
                'status' => ['required', 'string', 'in:active,inactive'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $vehicle = Vehicle::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $data = $validation->validated();
            unset($data['id']);
            $vehicle->update($data);

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
