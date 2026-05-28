<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\RedirectsToInvoiceReturn;
use App\Models\Vehicle;
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
            ->where('is_active', true)
            ->orderBy('number')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Vehicles/Index', [
            'vehicles' => $vehicles,
            ...$this->returnContext($request),
        ]);
    }

    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'number' => ['required', 'string', 'max:20'],
            'description' => ['nullable', 'string', 'max:255'],
            'return_route' => ['nullable', 'string', 'max:100'],
            'return_id' => ['nullable', 'integer'],
        ]);

        $number = strtoupper(trim($validated['number']));

        $vehicle = Vehicle::query()->firstOrCreate(
            ['user_id' => $request->user()->id, 'number' => $number],
            [
                'description' => $validated['description'] ?? null,
                'is_active' => true,
            ],
        );

        if ($request->expectsJson()) {
            return response()->json([
                'id' => $vehicle->id,
                'number' => $vehicle->number,
            ]);
        }

        return $this->redirectAfterMasterStore(
            $request,
            'vehicles.index',
            'Vehicle saved.',
        );
    }

    public function destroy(Request $request, Vehicle $vehicle): RedirectResponse
    {
        abort_unless($vehicle->user_id === $request->user()->id, 403);
        $vehicle->update(['is_active' => false]);

        return redirect()->route('vehicles.index')->with('success', 'Vehicle removed.');
    }
}
