<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\RouteLocation;
use App\Support\ListFilter;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RouteLocationApiController extends Controller
{
    public function postRoutesList(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $perPage = (int) ($request->input('per_page') ?: 20);
            $currentPage = (int) ($request->input('current_page') ?: 1);
            $dateFilters = ListFilter::dateFromRequest($request);
            $search = ListFilter::searchFromRequest($request);

            $query = RouteLocation::query()
                ->where('user_id', $userId)
                ->where('is_active', true);
            ListFilter::applySearch($query, $search, ['name']);
            ListFilter::applyDate($query, $dateFilters, 'created_at');
            $query->orderBy('name');

            $routes = $query->paginate($perPage, ['*'], 'page', $currentPage);

            $filterSummary = ListFilter::summary([
                $search !== '' ? 'Search: '.$search : null,
                ListFilter::dateSummary($dateFilters),
            ], 'All routes');

            return $this->sendJsonResponse(true, 'Routes loaded.', [
                'routes' => $routes,
                'filters' => [
                    'search' => $search,
                    ...$dateFilters,
                ],
                'filterSummary' => $filterSummary,
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
