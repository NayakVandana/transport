<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Support\DocumentValidation;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class DriverApiController extends Controller
{
    public function postDriversList(Request $request)
    {
        try {
            $perPage = (int) ($request->input('per_page') ?: 15);
            $currentPage = (int) ($request->input('current_page') ?: 1);

            $drivers = Driver::query()
                ->where('user_id', $request->user()->id)
                ->orderBy('name')
                ->paginate($perPage, ['*'], 'page', $currentPage);

            return $this->sendJsonResponse(true, 'Drivers loaded.', [
                'drivers' => $drivers,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postDriverMeta(Request $request)
    {
        try {
            return $this->sendJsonResponse(true, 'Driver form data loaded.', [
                'document_types' => DocumentValidation::driverOptionsForFrontend(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postDriverShow(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $driver = Driver::query()
                ->with(['documents' => fn ($query) => $query->orderByDesc('created_at')])
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            return $this->sendJsonResponse(true, 'Driver loaded.', [
                'driver' => $driver,
                'document_types' => DocumentValidation::driverOptionsForFrontend(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postDriverStore(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), $this->rules());

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $driver = Driver::query()->create([
                ...$validation->validated(),
                'user_id' => $request->user()->id,
            ]);

            return $this->sendJsonResponse(true, 'Driver created.', [
                'driver' => $driver,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postDriverUpdate(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
                ...$this->rules(),
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $driver = Driver::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $data = $validation->validated();
            unset($data['id']);
            $driver->update($data);

            return $this->sendJsonResponse(true, 'Driver updated.', [
                'driver' => $driver->fresh(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postDriverDestroy(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $driver = Driver::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $driver->delete();

            return $this->sendJsonResponse(true, 'Driver deleted.', null, 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    /** @return array<string, list<mixed>> */
    private function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'mobile' => ['nullable', 'string', 'max:15'],
            'license_number' => ['nullable', 'string', 'max:50'],
            'license_expiry' => ['nullable', 'date'],
            'joining_date' => ['nullable', 'date'],
            'salary' => ['nullable', 'numeric', 'min:0'],
            'address' => ['nullable', 'string'],
            'status' => ['required', 'string', Rule::in(['active', 'inactive'])],
        ];
    }
}
