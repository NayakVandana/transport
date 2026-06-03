<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\DailyReport;
use App\Support\DailyReportReport;
use App\Support\ListExport;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DailyReportApiController extends Controller
{
    public function postDailyReportsList(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $filters = DailyReportReport::filtersFromRequest($request, $userId);
            $vehicles = DailyReportReport::vehiclesForUser($userId);
            $parties = DailyReportReport::partiesForUser($userId);
            $reportDate = DailyReportReport::singleReportDate($filters);

            if ($reportDate !== null) {
                $rows = DailyReportReport::vehicleWiseRowsForDate($userId, $reportDate, $filters);

                return $this->sendJsonResponse(true, 'Daily reports loaded.', [
                    'dailyReports' => ['data' => $rows],
                    'vehicleWise' => true,
                    'vehicles' => $vehicles,
                    'parties' => $parties,
                    'routes' => DailyReportReport::routesForUser($userId),
                    'filters' => $filters,
                    'totals' => DailyReportReport::totalsFromRows($rows),
                    'filterSummary' => DailyReportReport::filterSummary($filters, $vehicles, $parties),
                ], 200);
            }

            $query = DailyReportReport::filteredQuery($userId, $filters);
            $perPage = (int) ($request->input('per_page') ?: 50);
            $currentPage = (int) ($request->input('current_page') ?: 1);

            $paginator = (clone $query)->paginate($perPage, ['*'], 'page', $currentPage);

            return $this->sendJsonResponse(true, 'Daily reports loaded.', [
                'dailyReports' => $paginator,
                'vehicleWise' => false,
                'vehicles' => $vehicles,
                'parties' => $parties,
                'filters' => $filters,
                'totals' => DailyReportReport::totals($query),
                'filterSummary' => DailyReportReport::filterSummary($filters, $vehicles, $parties),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postDailyReportMeta(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $reportDate = $request->input('report_date') ?: now()->toDateString();

            return $this->sendJsonResponse(true, 'Daily report form data loaded.', [
                'vehicles' => DailyReportReport::vehiclesForUser($userId),
                'parties' => DailyReportReport::partiesForUser($userId),
                'routes' => DailyReportReport::routesForUser($userId),
                'nextSerialNumber' => DailyReportReport::nextSerialNumber($userId, $reportDate),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postDailyReportShow(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $userId = (int) $request->user()->id;
            $report = DailyReport::query()
                ->with([
                    'vehicle:id,vehicle_number',
                    'currentParty:id,name',
                    'planningParty:id,name',
                ])
                ->where('user_id', $userId)
                ->findOrFail($request->input('id'));

            return $this->sendJsonResponse(true, 'Daily report loaded.', [
                'dailyReport' => $report,
                'vehicles' => DailyReportReport::vehiclesForUser($userId),
                'parties' => DailyReportReport::partiesForUser($userId),
                'routes' => DailyReportReport::routesForUser($userId),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postDailyReportStore(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $validated = $this->validateReport($request, $userId);

            if ($validated instanceof JsonResponse) {
                return $validated;
            }

            $reportDate = $validated['report_date'];
            $serialNumber = $validated['serial_number'] ?? DailyReportReport::nextSerialNumber($userId, $reportDate);

            $existing = DailyReport::query()
                ->where('user_id', $userId)
                ->whereDate('report_date', $reportDate)
                ->where('vehicle_id', $validated['vehicle_id'])
                ->first();

            if ($existing) {
                unset($validated['serial_number']);
                $existing->update($validated);

                return $this->sendJsonResponse(true, 'Daily report saved.', [
                    'dailyReport' => $existing->fresh()->load([
                        'vehicle:id,vehicle_number',
                        'currentParty:id,name',
                        'planningParty:id,name',
                    ]),
                ], 200);
            }

            $report = DailyReport::query()->create([
                ...$validated,
                'serial_number' => $serialNumber,
                'user_id' => $userId,
            ]);

            return $this->sendJsonResponse(true, 'Daily report saved.', [
                'dailyReport' => $report->load([
                    'vehicle:id,vehicle_number',
                    'currentParty:id,name',
                    'planningParty:id,name',
                ]),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postDailyReportUpdate(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $validated = $this->validateReport($request, $userId, true);

            if ($validated instanceof JsonResponse) {
                return $validated;
            }

            $report = DailyReport::query()
                ->where('user_id', $userId)
                ->findOrFail($request->input('id'));

            unset($validated['id']);
            $report->update($validated);

            return $this->sendJsonResponse(true, 'Daily report updated.', [
                'dailyReport' => $report->fresh()->load([
                    'vehicle:id,vehicle_number',
                    'currentParty:id,name',
                    'planningParty:id,name',
                ]),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postDailyReportDestroy(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $report = DailyReport::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $report->delete();

            return $this->sendJsonResponse(true, 'Daily report removed.', null, 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postDailyReportsBulkSave(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;

            $validation = Validator::make($request->all(), [
                'report_date' => ['required', 'date'],
                'rows' => ['required', 'array'],
                'rows.*.vehicle_id' => [
                    'required',
                    'integer',
                    Rule::exists('vehicles', 'id')->where(
                        fn ($query) => $query->where('user_id', $userId)->whereNull('deleted_at'),
                    ),
                ],
                'rows.*.serial_number' => ['required', 'integer', 'min:1'],
                'rows.*.description' => ['nullable', 'string', 'max:500'],
                'rows.*.current_party_id' => [
                    'nullable',
                    'integer',
                    Rule::exists('parties', 'id')->where(
                        fn ($query) => $query->where('user_id', $userId),
                    ),
                ],
                'rows.*.planning_party_id' => [
                    'nullable',
                    'integer',
                    Rule::exists('parties', 'id')->where(
                        fn ($query) => $query->where('user_id', $userId),
                    ),
                ],
                'rows.*.location' => ['nullable', 'string', 'max:255'],
                'rows.*.detention' => ['nullable', 'numeric', 'min:0'],
                'rows.*.day' => ['nullable', 'integer', 'min:1', 'max:366'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $validated = $validation->validated();
            $reportDate = $validated['report_date'];

            DB::transaction(function () use ($userId, $reportDate, $validated) {
                foreach ($validated['rows'] as $row) {
                    $this->upsertReportRow($userId, $reportDate, $row);
                }
            });

            $filters = [
                'search' => '',
                'vehicle_id' => '',
                'party_id' => '',
                'date_range' => 'custom',
                'date_from' => $reportDate,
                'date_to' => $reportDate,
            ];
            $rows = DailyReportReport::vehicleWiseRowsForDate($userId, $reportDate, $filters);

            return $this->sendJsonResponse(true, 'Daily report saved.', [
                'dailyReports' => ['data' => $rows],
                'totals' => DailyReportReport::totalsFromRows($rows),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    /** @param  array<string, mixed>  $row */
    private function upsertReportRow(int $userId, string $reportDate, array $row): void
    {
        $vehicleId = (int) $row['vehicle_id'];

        $payload = [
            'serial_number' => (int) $row['serial_number'],
            'description' => $row['description'] ?? null,
            'current_party_id' => array_key_exists('current_party_id', $row) && $row['current_party_id'] !== null
                ? (int) $row['current_party_id']
                : null,
            'planning_party_id' => array_key_exists('planning_party_id', $row) && $row['planning_party_id'] !== null
                ? (int) $row['planning_party_id']
                : null,
            'location' => $row['location'] ?? null,
            'detention' => round((float) ($row['detention'] ?? 0), 2),
            'day' => array_key_exists('day', $row) && $row['day'] !== null ? (int) $row['day'] : null,
        ];

        DailyReport::query()->updateOrCreate(
            [
                'user_id' => $userId,
                'report_date' => $reportDate,
                'vehicle_id' => $vehicleId,
            ],
            $payload,
        );
    }

    public function postDailyReportsExportCsv(Request $request): StreamedResponse|JsonResponse
    {
        try {
            $userId = (int) $request->user()->id;
            $filters = DailyReportReport::filtersFromRequest($request, $userId);
            $vehicles = DailyReportReport::vehiclesForUser($userId);
            $parties = DailyReportReport::partiesForUser($userId);
            [$rows, $totals] = $this->resolveExportRows($userId, $filters);

            return ListExport::csv(
                'daily-reports',
                'Daily Report Export',
                DailyReportReport::filterSummary($filters, $vehicles, $parties),
                [
                    'Serial Number',
                    'Vehicle',
                    'Description',
                    'Current Party',
                    'Planning Party',
                    'Location',
                    'Date',
                    'Detention',
                    'Day',
                ],
                collect($rows)->map(fn (array $row) => $this->exportRowFromArray($row)),
                [
                    'TOTAL',
                    $totals['count'].' rows',
                    '',
                    '',
                    '',
                    '',
                    '',
                    ListExport::formatMoney($totals['detention']),
                    '',
                ],
            );
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postDailyReportsExportPdf(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $filters = DailyReportReport::filtersFromRequest($request, $userId);
            $vehicles = DailyReportReport::vehiclesForUser($userId);
            $parties = DailyReportReport::partiesForUser($userId);
            [$rows, $totals] = $this->resolveExportRows($userId, $filters);

            return ListExport::pdf(
                'daily-reports',
                'Daily Report',
                DailyReportReport::filterSummary($filters, $vehicles, $parties),
                [
                    'S.No.',
                    'Vehicle',
                    'Description',
                    'Current Party',
                    'Planning Party',
                    'Location',
                    'Date',
                    'Detention',
                    'Day',
                ],
                collect($rows)->map(fn (array $row) => $this->exportRowFromArray($row)),
                count($rows),
                [
                    'TOTAL',
                    $totals['count'].' rows',
                    '',
                    '',
                    '',
                    '',
                    '',
                    ListExport::formatMoney($totals['detention']),
                    '',
                ],
            );
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    /** @return array{0: list<array<string, mixed>>, 1: array{count: int, detention: float}} */
    private function resolveExportRows(int $userId, array $filters): array
    {
        $reportDate = DailyReportReport::singleReportDate($filters);

        if ($reportDate !== null) {
            $rows = DailyReportReport::vehicleWiseRowsForDate($userId, $reportDate, $filters);

            return [$rows, DailyReportReport::totalsFromRows($rows)];
        }

        $query = DailyReportReport::filteredQuery($userId, $filters);
        $rows = $query->get()
            ->map(fn (DailyReport $row) => $row->toArray())
            ->values()
            ->all();

        return [$rows, DailyReportReport::totals($query)];
    }

    /** @param  array<string, mixed>  $row  @return array<int, mixed> */
    private function exportRowFromArray(array $row): array
    {
        $currentParty = $row['current_party']['name'] ?? $row['currentParty']['name'] ?? '';
        $planningParty = $row['planning_party']['name'] ?? $row['planningParty']['name'] ?? '';

        return [
            $row['serial_number'] ?? '',
            $row['vehicle']['vehicle_number'] ?? '',
            $row['description'] ?? '',
            $currentParty,
            $planningParty,
            $row['location'] ?? '',
            ListExport::formatDate($row['report_date']),
            ListExport::formatMoney($row['detention'] ?? 0),
            self::dayLabelFromArray($row),
        ];
    }

    /** @param  array<string, mixed>  $row */
    private static function dayLabelFromArray(array $row): string
    {
        if (($row['day'] ?? null) !== null) {
            return (string) $row['day'];
        }

        return Carbon::parse($row['report_date'])->format('D');
    }

    /** @return array<string, mixed>|JsonResponse */
    private function validateReport(Request $request, int $userId, bool $updating = false): array|JsonResponse
    {
        $request->merge([
            'vehicle_id' => $request->filled('vehicle_id') ? (int) $request->input('vehicle_id') : null,
            'current_party_id' => $request->filled('current_party_id') ? (int) $request->input('current_party_id') : null,
            'planning_party_id' => $request->filled('planning_party_id') ? (int) $request->input('planning_party_id') : null,
            'day' => $request->filled('day') ? (int) $request->input('day') : null,
        ]);

        $rules = [
            'report_date' => ['required', 'date'],
            'vehicle_id' => [
                'required',
                'integer',
                Rule::exists('vehicles', 'id')->where(
                    fn ($query) => $query->where('user_id', $userId)->whereNull('deleted_at'),
                ),
            ],
            'description' => ['nullable', 'string', 'max:500'],
            'current_party_id' => [
                'nullable',
                'integer',
                Rule::exists('parties', 'id')->where(
                    fn ($query) => $query->where('user_id', $userId),
                ),
            ],
            'planning_party_id' => [
                'nullable',
                'integer',
                Rule::exists('parties', 'id')->where(
                    fn ($query) => $query->where('user_id', $userId),
                ),
            ],
            'location' => ['nullable', 'string', 'max:255'],
            'detention' => ['nullable', 'numeric', 'min:0'],
            'day' => ['nullable', 'integer', 'min:1', 'max:366'],
            'serial_number' => ['nullable', 'integer', 'min:1'],
        ];

        if ($updating) {
            $rules['id'] = ['required', 'integer'];
        }

        $validation = Validator::make($request->all(), $rules);

        if ($validation->fails()) {
            return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
        }

        $validated = $validation->validated();
        $validated['detention'] = round((float) ($validated['detention'] ?? 0), 2);

        if ($updating) {
            return $validated;
        }

        unset($validated['id']);

        return $validated;
    }
}
