<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Support\ListFilter;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CustomerApiController extends Controller
{
    public function postCustomersList(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $perPage = (int) ($request->input('per_page') ?: 15);
            $currentPage = (int) ($request->input('current_page') ?: 1);
            $dateFilters = ListFilter::dateFromRequest($request);
            $search = ListFilter::searchFromRequest($request);

            $query = Customer::query()
                ->where('user_id', $userId);
            ListFilter::applySearch($query, $search, ['name', 'mobile', 'address']);
            ListFilter::applyDate($query, $dateFilters, 'created_at');
            $query->orderBy('name');

            $customers = $query->paginate($perPage, ['*'], 'page', $currentPage);

            $filterSummary = ListFilter::summary([
                $search !== '' ? 'Search: '.$search : null,
                ListFilter::dateSummary($dateFilters),
            ], 'All customers');

            return $this->sendJsonResponse(true, 'Customers loaded.', [
                'customers' => $customers,
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

    public function postCustomerShow(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $customer = Customer::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            return $this->sendJsonResponse(true, 'Customer loaded.', [
                'customer' => $customer,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postCustomerStore(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), $this->rules());

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $customer = Customer::query()->create([
                ...$validation->validated(),
                'user_id' => $request->user()->id,
            ]);

            return $this->sendJsonResponse(true, 'Customer created.', [
                'customer' => $customer,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postCustomerUpdate(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
                ...$this->rules(),
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $customer = Customer::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $data = $validation->validated();
            unset($data['id']);
            $customer->update($data);

            return $this->sendJsonResponse(true, 'Customer updated.', [
                'customer' => $customer->fresh(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postCustomerDestroy(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $customer = Customer::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $customer->delete();

            return $this->sendJsonResponse(true, 'Customer deleted.', null, 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    /** @return array<string, list<string>> */
    private function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'mobile' => ['nullable', 'string', 'max:15'],
            'address' => ['nullable', 'string'],
            'state_code' => ['nullable', 'string', 'max:5'],
        ];
    }
}
