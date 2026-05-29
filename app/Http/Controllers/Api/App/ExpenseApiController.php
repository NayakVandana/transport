<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Support\BookingReport;
use App\Support\ExpenseValidation;
use App\Support\ListExport;
use App\Support\ListFilter;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExpenseApiController extends Controller
{
    public function postExpensesList(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $perPage = (int) ($request->input('per_page') ?: 20);
            $currentPage = (int) ($request->input('current_page') ?: 1);
            [$query, $filterSummary, $filters] = $this->filteredExpensesQuery($request, $userId);

            $totalAmount = (float) (clone $query)->toBase()->sum('amount');
            $expenses = $query->paginate($perPage, ['*'], 'page', $currentPage);

            $vehicles = BookingReport::vehiclesForUser($userId);

            return $this->sendJsonResponse(true, 'Expenses loaded.', [
                'expenses' => $expenses,
                'total_amount' => round($totalAmount, 2),
                'vehicles' => $vehicles,
                'categories' => ExpenseValidation::optionsForFrontend()['categories'],
                'payment_methods' => ExpenseValidation::optionsForFrontend()['payment_methods'],
                'filters' => $filters,
                'filterSummary' => $filterSummary,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postExpensesExportCsv(Request $request): StreamedResponse|JsonResponse
    {
        try {
            $userId = (int) $request->user()->id;
            [$query, $filterSummary] = $this->filteredExpensesQuery($request, $userId);
            $totalAmount = (float) (clone $query)->toBase()->sum('amount');
            $expenses = $query->get();
            $categoryLabels = ExpenseValidation::categoryLabels();

            return ListExport::csv(
                'expenses',
                'Expenses Export',
                $filterSummary,
                ['Date', 'Category', 'Amount', 'Description', 'Vehicle', 'Driver', 'Payment'],
                $expenses->map(fn ($expense) => [
                    ListExport::formatDate($expense->expense_date),
                    $categoryLabels[$expense->category] ?? $expense->category,
                    $expense->amount,
                    $expense->description ?? '',
                    $expense->vehicle?->vehicle_number ?? '',
                    $expense->driver?->name ?? '',
                    strtoupper($expense->payment_method ?? ''),
                ]),
                ['TOTAL', $expenses->count().' expenses', ListExport::formatMoney($totalAmount), '', '', '', ''],
            );
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postExpensesExportPdf(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            [$query, $filterSummary] = $this->filteredExpensesQuery($request, $userId);
            $totalAmount = (float) (clone $query)->toBase()->sum('amount');
            $expenses = $query->get();
            $categoryLabels = ExpenseValidation::categoryLabels();

            return ListExport::pdf(
                'expenses',
                'Expenses Report',
                $filterSummary,
                ['Date', 'Category', 'Amount', 'Description', 'Vehicle', 'Driver', 'Payment'],
                $expenses->map(fn ($expense) => [
                    ListExport::formatDate($expense->expense_date),
                    $categoryLabels[$expense->category] ?? $expense->category,
                    ListExport::formatMoney($expense->amount),
                    $expense->description ?? '—',
                    $expense->vehicle?->vehicle_number ?? '—',
                    $expense->driver?->name ?? '—',
                    strtoupper($expense->payment_method ?? '—'),
                ]),
                $expenses->count(),
                ['TOTAL', $expenses->count().' expenses', ListExport::formatMoney($totalAmount), '', '', '', ''],
                [
                    ['label' => 'Total Amount', 'value' => '₹ '.ListExport::formatMoney($totalAmount)],
                ],
            );
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postExpenseMeta(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;

            return $this->sendJsonResponse(true, 'Expense form data loaded.', [
                ...ExpenseValidation::optionsForFrontend(),
                'vehicles' => BookingReport::vehiclesForUser($userId),
                'drivers' => BookingReport::driversForUser($userId),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postExpenseShow(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $userId = (int) $request->user()->id;
            $expense = Expense::query()
                ->with([
                    'vehicle:id,vehicle_number',
                    'driver:id,name',
                ])
                ->where('user_id', $userId)
                ->findOrFail($request->input('id'));

            return $this->sendJsonResponse(true, 'Expense loaded.', [
                'expense' => $expense,
                ...ExpenseValidation::optionsForFrontend(),
                'vehicles' => BookingReport::vehiclesForUser($userId),
                'drivers' => BookingReport::driversForUser($userId),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postExpenseStore(Request $request)
    {
        try {
            $this->normalizeInput($request);
            $validation = Validator::make($request->all(), $this->rules($request));

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $userId = (int) $request->user()->id;

            $expense = Expense::query()->create([
                ...collect($validation->validated())->except(['remove_bill_copy'])->all(),
                'user_id' => $userId,
                ...$this->billCopyAttributes($request, $userId),
            ]);

            return $this->sendJsonResponse(true, 'Expense created.', [
                'expense' => $expense->load([
                    'vehicle:id,vehicle_number',
                    'driver:id,name',
                ]),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postExpenseUpdate(Request $request)
    {
        try {
            $this->normalizeInput($request);
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
                ...$this->rules($request),
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $userId = (int) $request->user()->id;
            $expense = Expense::query()
                ->where('user_id', $userId)
                ->findOrFail($request->input('id'));

            $data = collect($validation->validated())->except(['id', 'remove_bill_copy'])->all();
            $data = [
                ...$data,
                ...$this->billCopyAttributes($request, $userId, $expense),
            ];
            $expense->update($data);

            return $this->sendJsonResponse(true, 'Expense updated.', [
                'expense' => $expense->fresh()->load([
                    'vehicle:id,vehicle_number',
                    'driver:id,name',
                ]),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postExpenseDestroy(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $expense = Expense::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            if ($expense->bill_copy) {
                $this->deleteBillCopy($expense->bill_copy);
            }

            $expense->delete();

            return $this->sendJsonResponse(true, 'Expense deleted.', null, 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    /** @return array<string, list<mixed>> */
    private function rules(Request $request): array
    {
        $userId = (int) $request->user()->id;

        return [
            'expense_date' => ['required', 'date'],
            'category' => ['required', 'string', Rule::in(ExpenseValidation::categories())],
            'amount' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'vehicle_id' => [
                'nullable',
                'integer',
                Rule::exists('vehicles', 'id')->where(
                    fn ($query) => $query->where('user_id', $userId)->whereNull('deleted_at'),
                ),
            ],
            'driver_id' => [
                'nullable',
                'integer',
                Rule::exists('drivers', 'id')->where(
                    fn ($query) => $query->where('user_id', $userId)->whereNull('deleted_at'),
                ),
            ],
            'payment_method' => ['nullable', 'string', Rule::in(ExpenseValidation::paymentMethods())],
            'bill_copy' => ['nullable', 'file', 'mimes:jpeg,jpg,png,pdf', 'max:5120'],
            'remove_bill_copy' => ['nullable', 'boolean'],
        ];
    }

    /** @return array<string, string|null> */
    private function billCopyAttributes(Request $request, int $userId, ?Expense $existing = null): array
    {
        if ($request->hasFile('bill_copy')) {
            if ($existing?->bill_copy) {
                $this->deleteBillCopy($existing->bill_copy);
            }

            return [
                'bill_copy' => $request->file('bill_copy')->store("expenses/{$userId}", 'public'),
            ];
        }

        if ($request->boolean('remove_bill_copy') && $existing?->bill_copy) {
            $this->deleteBillCopy($existing->bill_copy);

            return ['bill_copy' => null];
        }

        return [];
    }

    private function deleteBillCopy(string $path): void
    {
        Storage::disk('public')->delete($path);
    }

    private function normalizeInput(Request $request): void
    {
        $request->merge([
            'vehicle_id' => $request->filled('vehicle_id') ? (int) $request->input('vehicle_id') : null,
            'driver_id' => $request->filled('driver_id') ? (int) $request->input('driver_id') : null,
            'payment_method' => $request->input('payment_method') ?: null,
            'remove_bill_copy' => $request->boolean('remove_bill_copy'),
        ]);
    }

    /**
     * @return array{0: \Illuminate\Database\Eloquent\Builder, 1: string, 2: array<string, string>}
     */
    private function filteredExpensesQuery(Request $request, int $userId): array
    {
        $dateFilters = ListFilter::dateFromRequest($request);
        $search = ListFilter::searchFromRequest($request);
        $vehicleId = ListFilter::optionalIdFromRequest($request, 'vehicle_id');
        $driverId = ListFilter::optionalIdFromRequest($request, 'driver_id');

        $validated = $request->validate([
            'category' => ['nullable', 'string', Rule::in(ExpenseValidation::categories())],
            'payment_method' => ['nullable', 'string', Rule::in(ExpenseValidation::paymentMethods())],
        ]);
        $category = $validated['category'] ?? '';
        $paymentMethod = $validated['payment_method'] ?? '';

        if ($vehicleId !== '') {
            $ownsVehicle = \App\Models\Vehicle::query()
                ->where('user_id', $userId)
                ->whereKey($vehicleId)
                ->exists();
            if (! $ownsVehicle) {
                $vehicleId = '';
            }
        }

        if ($driverId !== '') {
            $ownsDriver = \App\Models\Driver::query()
                ->where('user_id', $userId)
                ->whereKey($driverId)
                ->exists();
            if (! $ownsDriver) {
                $driverId = '';
            }
        }

        $query = Expense::query()
            ->with([
                'vehicle:id,vehicle_number',
                'driver:id,name',
            ])
            ->where('user_id', $userId);
        ListFilter::applyDate($query, $dateFilters, 'expense_date');
        ListFilter::applySearch($query, $search, ['description', 'category']);
        if ($vehicleId !== '') {
            $query->where('vehicle_id', $vehicleId);
        }
        if ($driverId !== '') {
            $query->where('driver_id', $driverId);
        }
        if ($category !== '') {
            $query->where('category', $category);
        }
        if ($paymentMethod !== '') {
            $query->where('payment_method', $paymentMethod);
        }
        $query->orderByDesc('expense_date')->orderByDesc('id');

        $vehicles = BookingReport::vehiclesForUser($userId);
        $categoryLabel = $category !== ''
            ? collect(ExpenseValidation::categoryLabels())->get($category)
            : null;

        $filterSummary = ListFilter::summary([
            $search !== '' ? 'Search: '.$search : null,
            $categoryLabel ? 'Category: '.$categoryLabel : null,
            $paymentMethod !== '' ? 'Payment: '.strtoupper($paymentMethod) : null,
            $vehicleId !== '' ? 'Vehicle: '.($vehicles->firstWhere('id', (int) $vehicleId)?->vehicle_number ?? 'All') : null,
            ListFilter::dateSummary($dateFilters),
        ], 'All expenses');

        return [$query, $filterSummary, [
            'search' => $search,
            'category' => $category,
            'payment_method' => $paymentMethod,
            'vehicle_id' => $vehicleId,
            'driver_id' => $driverId,
            ...$dateFilters,
        ]];
    }
}
