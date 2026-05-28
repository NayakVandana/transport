<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\RedirectsToInvoiceReturn;
use App\Models\RouteLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RouteLocationController extends Controller
{
    use RedirectsToInvoiceReturn;

    public function index(Request $request): Response
    {
        $routes = RouteLocation::query()
            ->where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Routes/Index', [
            'routes' => $routes,
            ...$this->returnContext($request),
        ]);
    }

    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'return_route' => ['nullable', 'string', 'max:100'],
            'return_id' => ['nullable', 'integer'],
        ]);

        $name = trim($validated['name']);

        $route = RouteLocation::query()->firstOrCreate(
            ['user_id' => $request->user()->id, 'name' => $name],
            ['is_active' => true],
        );

        if ($request->expectsJson()) {
            return response()->json([
                'id' => $route->id,
                'name' => $route->name,
            ]);
        }

        return $this->redirectAfterMasterStore(
            $request,
            'routes.index',
            'Route saved.',
        );
    }

    public function destroy(Request $request, RouteLocation $route): RedirectResponse
    {
        abort_unless($route->user_id === $request->user()->id, 403);
        $route->update(['is_active' => false]);

        return redirect()->route('routes.index')->with('success', 'Route removed.');
    }
}
