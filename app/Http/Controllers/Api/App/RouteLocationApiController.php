<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\RouteLocation;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RouteLocationApiController extends Controller
{
    public function postRoutesList(Request $request)
    {
        try {
            $perPage = (int) ($request->input('per_page') ?: 20);
            $currentPage = (int) ($request->input('current_page') ?: 1);

            $routes = RouteLocation::query()
                ->where('user_id', $request->user()->id)
                ->where('is_active', true)
                ->orderBy('name')
                ->paginate($perPage, ['*'], 'page', $currentPage);

            return $this->sendJsonResponse(true, 'Routes loaded.', [
                'routes' => $routes,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postRouteStore(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'name' => ['required', 'string', 'max:255'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $name = trim($validation->validated()['name']);

            $route = RouteLocation::query()->firstOrCreate(
                ['user_id' => $request->user()->id, 'name' => $name],
                ['is_active' => true],
            );

            if (! $route->is_active) {
                $route->update(['is_active' => true]);
            }

            return $this->sendJsonResponse(true, 'Route saved.', [
                'route' => $route,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postRouteDestroy(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $route = RouteLocation::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $route->update(['is_active' => false]);

            return $this->sendJsonResponse(true, 'Route removed.', null, 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }
}
