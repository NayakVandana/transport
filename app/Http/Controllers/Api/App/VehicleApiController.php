<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Http\Requests\VehicleRequest;
use App\Models\Vehicle;
use App\Support\DocumentValidation;
use App\Support\ListFilter;
use App\Support\VehicleValidation;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VehicleApiController extends Controller
{
    public function postVehiclesList(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $perPage = (int) ($request->input('per_page') ?: 20);
            $currentPage = (int) ($request->input('current_page') ?: 1);
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

            $vehicles = $query->paginate($perPage, ['*'], 'page', $currentPage);

            $filterSummary = ListFilter::summary([
                $search !== '' ? 'Search: '.$search : null,
                $status !== '' ? 'Status: '.ucfirst($status) : null,
                ListFilter::dateSummary($dateFilters),
            ], 'All vehicles');

            return $this->sendJsonResponse(true, 'Vehicles loaded.', [
                'vehicles' => $vehicles,
                'filters' => [
                    'search' => $search,
                    'status' => $status,
                    ...$dateFilters,
                ],
                'filterSummary' => $filterSummary,
            ], 200);
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
}
