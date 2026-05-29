<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\RedirectsToInvoiceReturn;
use App\Http\Requests\VehicleRequest;
use App\Models\Vehicle;
use App\Support\VehicleValidation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VehicleController extends Controller
{
    use RedirectsToInvoiceReturn;

    public function index(Request $request): Response
    {
        $vehicles = Vehicle::query()
            ->where('user_id', $request->user()->id)
            ->orderBy('vehicle_number')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Vehicles/Index', [
            'vehicles' => $vehicles,
            ...$this->returnContext($request),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Vehicles/Form', [
            'vehicle' => null,
            'validationMessages' => VehicleValidation::forFrontend(),
            'fuelTypes' => VehicleValidation::fuelTypes(),
            ...$this->returnContext($request),
        ]);
    }

    public function store(VehicleRequest $request): RedirectResponse|JsonResponse
    {
        $vehicle = Vehicle::query()->create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'id' => $vehicle->id,
                'vehicle_number' => $vehicle->vehicle_number,
            ]);
        }

        return $this->redirectAfterMasterStore(
            $request,
            'vehicles.index',
            'Vehicle saved.',
        );
    }

    public function edit(Request $request, Vehicle $vehicle): Response
    {
        $this->authorizeVehicle($request, $vehicle);

        return Inertia::render('Vehicles/Form', [
            'vehicle' => $vehicle,
            'validationMessages' => VehicleValidation::forFrontend(),
            'fuelTypes' => VehicleValidation::fuelTypes(),
            ...$this->returnContext($request),
        ]);
    }

    public function update(VehicleRequest $request, Vehicle $vehicle): RedirectResponse
    {
        $this->authorizeVehicle($request, $vehicle);
        $vehicle->update($request->validated());

        return redirect()->route('vehicles.index')->with('success', 'Vehicle updated.');
    }

    public function destroy(Request $request, Vehicle $vehicle): RedirectResponse
    {
        $this->authorizeVehicle($request, $vehicle);
        $vehicle->delete();

        return redirect()->route('vehicles.index')->with('success', 'Vehicle removed.');
    }

    private function authorizeVehicle(Request $request, Vehicle $vehicle): void
    {
        abort_unless($vehicle->user_id === $request->user()->id, 403);
    }
}
