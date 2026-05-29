<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Support\BookingReport;
use App\Support\ExpenseValidation;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ExpenseApiController extends Controller
{
    public function postExpensesList(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $perPage = (int) ($request->input('per_page') ?: 20);
            $currentPage = (int) ($request->input('current_page') ?: 1);

            $query = Expense::query()
                ->with([
                    'vehicle:id,vehicle_number',
                    'driver:id,name',
                ])
                ->where('user_id', $userId)
                ->orderByDesc('expense_date')
                ->orderByDesc('id');

            $totalAmount = (float) (clone $query)->toBase()->sum('amount');
            $expenses = $query->paginate($perPage, ['*'], 'page', $currentPage);

            return $this->sendJsonResponse(true, 'Expenses loaded.', [
                'expenses' => $expenses,
                'total_amount' => round($totalAmount, 2),
            ], 200);
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
}
