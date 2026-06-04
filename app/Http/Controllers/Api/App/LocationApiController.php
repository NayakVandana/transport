<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Support\ListExport;
use App\Support\ListFilter;
use App\Support\RoutePairRegistry;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LocationApiController extends Controller
{
    public function postLocationsList(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $perPage = (int) ($request->input('per_page') ?: 20);
            $currentPage = (int) ($request->input('current_page') ?: 1);
            [$query, $filterSummary, $filters] = $this->filteredLocationsQuery($request);

            $locations = $query->paginate($perPage, ['*'], 'page', $currentPage);

            return $this->sendJsonResponse(true, 'Locations loaded.', [
                'locations' => $locations,
                'filters' => $filters,
                'filterSummary' => $filterSummary,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postLocationsExportCsv(Request $request): StreamedResponse|JsonResponse
    {
        try {
            [$query, $filterSummary] = $this->filteredLocationsQuery($request);
            $locations = $query->get();

            return ListExport::csv(
                'locations',
                'Locations Export',
                $filterSummary,
                ['Location Name', 'Created'],
                $locations->map(fn ($location) => [
                    $location->name,
                    ListExport::formatCreatedAt($location->created_at),
                ]),
                ['TOTAL', $locations->count().' locations'],
            );
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postLocationsExportPdf(Request $request)
    {
        try {
            [$query, $filterSummary] = $this->filteredLocationsQuery($request);
            $locations = $query->get();

            return ListExport::pdf(
                'locations',
                'Locations Report',
                $filterSummary,
                ['Location Name', 'Created'],
                $locations->map(fn ($location) => [
                    $location->name,
                    ListExport::formatCreatedAt($location->created_at),
                ]),
                $locations->count(),
            );
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postLocationStore(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'name' => ['required', 'string', 'max:255'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $userId = (int) $request->user()->id;
            $normalized = RoutePairRegistry::normalize($validation->validated()['name']);
            $existing = RoutePairRegistry::findForUser($userId, $normalized);

            if ($existing?->is_active) {
                return $this->sendJsonResponse(false, 'This location already exists.', [
                    'name' => ['This location already exists.'],
                ], 200);
            }

            $location = RoutePairRegistry::ensureLocation($userId, $normalized);

            return $this->sendJsonResponse(true, 'Location saved.', [
                'location' => $location,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postLocationDestroy(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $location = Location::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $location->update(['is_active' => false]);

            return $this->sendJsonResponse(true, 'Location removed.', null, 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    /** @return array{0: \Illuminate\Database\Eloquent\Builder, 1: string, 2: array<string, string>} */
    private function filteredLocationsQuery(Request $request): array
    {
        $userId = (int) $request->user()->id;
        $dateFilters = ListFilter::dateFromRequest($request);
        $search = ListFilter::searchFromRequest($request);

        $query = Location::query()
            ->where('user_id', $userId)
            ->where('is_active', true);
        ListFilter::applySearch($query, $search, ['name']);
        ListFilter::applyDate($query, $dateFilters, 'created_at');
        $query->orderBy('name');

        $filterSummary = ListFilter::summary([
            $search !== '' ? 'Search: '.$search : null,
            ListFilter::dateSummary($dateFilters),
        ], 'All locations');

        return [$query, $filterSummary, [
            'search' => $search,
            ...$dateFilters,
        ]];
    }
}
