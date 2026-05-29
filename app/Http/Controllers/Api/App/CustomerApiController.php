<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Support\ListExport;
use App\Support\ListFilter;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CustomerApiController extends Controller
{
    public function postCustomersList(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $perPage = (int) ($request->input('per_page') ?: 15);
            $currentPage = (int) ($request->input('current_page') ?: 1);
            [$query, $filterSummary, $filters] = $this->filteredCustomersQuery($request);

            $customers = $query->paginate($perPage, ['*'], 'page', $currentPage);

            return $this->sendJsonResponse(true, 'Customers loaded.', [
                'customers' => $customers,
                'filters' => $filters,
                'filterSummary' => $filterSummary,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postCustomersExportCsv(Request $request): StreamedResponse|JsonResponse
    {
        try {
            [$query, $filterSummary] = $this->filteredCustomersQuery($request);
            $customers = $query->get();

            return ListExport::csv(
                'customers',
                'Customers Export',
                $filterSummary,
                ['Name', 'Mobile', 'Address', 'State', 'Created'],
                $customers->map(fn ($customer) => [
                    $customer->name,
                    $customer->mobile ?? '',
                    $customer->address ?? '',
                    $customer->state_code ?? '',
                    ListExport::formatDate($customer->created_at),
                ]),
                ['TOTAL', $customers->count().' customers', '', '', ''],
            );
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postCustomersExportPdf(Request $request)
    {
        try {
            [$query, $filterSummary] = $this->filteredCustomersQuery($request);
            $customers = $query->get();

            return ListExport::pdf(
                'customers',
                'Customers Report',
                $filterSummary,
                ['Name', 'Mobile', 'Address', 'State', 'Created'],
                $customers->map(fn ($customer) => [
                    $customer->name,
                    $customer->mobile ?? '—',
                    $customer->address ?? '—',
                    $customer->state_code ?? '—',
                    ListExport::formatDate($customer->created_at),
                ]),
                $customers->count(),
            );
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

    /** @return array{0: \Illuminate\Database\Eloquent\Builder, 1: string, 2: array<string, string>} */
    private function filteredCustomersQuery(Request $request): array
    {
        $userId = (int) $request->user()->id;
        $dateFilters = ListFilter::dateFromRequest($request);
        $search = ListFilter::searchFromRequest($request);

        $query = Customer::query()->where('user_id', $userId);
        ListFilter::applySearch($query, $search, ['name', 'mobile', 'address']);
        ListFilter::applyDate($query, $dateFilters, 'created_at');
        $query->orderBy('name');

        $filterSummary = ListFilter::summary([
            $search !== '' ? 'Search: '.$search : null,
            ListFilter::dateSummary($dateFilters),
        ], 'All customers');

        return [$query, $filterSummary, [
            'search' => $search,
            ...$dateFilters,
        ]];
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
