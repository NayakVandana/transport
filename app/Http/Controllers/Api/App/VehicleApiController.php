<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Http\Requests\VehicleRequest;
use App\Models\Vehicle;
use App\Support\VehicleValidation;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VehicleApiController extends Controller
{
    public function postVehiclesList(Request $request)
    {
        try {
            $perPage = (int) ($request->input('per_page') ?: 20);
            $currentPage = (int) ($request->input('current_page') ?: 1);

            $vehicles = Vehicle::query()
                ->where('user_id', $request->user()->id)
                ->orderBy('vehicle_number')
                ->paginate($perPage, ['*'], 'page', $currentPage);

            return $this->sendJsonResponse(true, 'Vehicles loaded.', [
                'vehicles' => $vehicles,
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
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            return $this->sendJsonResponse(true, 'Vehicle loaded.', [
                'vehicle' => $vehicle,
                'validationMessages' => VehicleValidation::forFrontend(),
                'fuelTypes' => VehicleValidation::fuelTypes(),
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
