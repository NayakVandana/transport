<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\VehicleDocument;
use App\Support\DocumentStorage;
use App\Support\DocumentValidation;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class VehicleDocumentApiController extends Controller
{
    public function postVehicleDocumentsList(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'vehicle_id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $userId = (int) $request->user()->id;
            $vehicle = $this->findVehicle($request->input('vehicle_id'), $userId);

            $documents = VehicleDocument::query()
                ->where('user_id', $userId)
                ->where('vehicle_id', $vehicle->id)
                ->orderByDesc('created_at')
                ->get();

            return $this->sendJsonResponse(true, 'Vehicle documents loaded.', [
                'documents' => $documents,
                'document_types' => DocumentValidation::vehicleOptionsForFrontend(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postVehicleDocumentStore(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $request->merge([
                'vehicle_id' => $request->filled('vehicle_id') ? (int) $request->input('vehicle_id') : null,
                'title' => $request->input('title') ?: null,
                'notes' => $request->input('notes') ?: null,
            ]);

            $validation = Validator::make($request->all(), [
                'vehicle_id' => [
                    'required',
                    'integer',
                    Rule::exists('vehicles', 'id')->where(
                        fn ($query) => $query->where('user_id', $userId)->whereNull('deleted_at'),
                    ),
                ],
                'document_type' => ['required', 'string', Rule::in(DocumentValidation::vehicleDocumentTypes())],
                'title' => ['nullable', 'string', 'max:255'],
                'file' => ['required', DocumentValidation::fileRule()],
                'expiry_date' => ['nullable', 'date'],
                'notes' => ['nullable', 'string'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $vehicle = $this->findVehicle($request->input('vehicle_id'), $userId);

            $document = VehicleDocument::query()->create([
                ...collect($validation->validated())->except(['file'])->all(),
                'user_id' => $userId,
                'vehicle_id' => $vehicle->id,
                'file_path' => DocumentStorage::store(
                    $request->file('file'),
                    "vehicles/{$userId}/{$vehicle->id}",
                ),
            ]);

            return $this->sendJsonResponse(true, 'Document uploaded.', [
                'document' => $document,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postVehicleDocumentUpdate(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $request->merge([
                'vehicle_id' => $request->filled('vehicle_id') ? (int) $request->input('vehicle_id') : null,
                'title' => $request->input('title') ?: null,
                'notes' => $request->input('notes') ?: null,
            ]);

            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
                'vehicle_id' => [
                    'required',
                    'integer',
                    Rule::exists('vehicles', 'id')->where(
                        fn ($query) => $query->where('user_id', $userId)->whereNull('deleted_at'),
                    ),
                ],
                'document_type' => ['required', 'string', Rule::in(DocumentValidation::vehicleDocumentTypes())],
                'title' => ['nullable', 'string', 'max:255'],
                'file' => ['nullable', DocumentValidation::fileRule()],
                'expiry_date' => ['nullable', 'date'],
                'notes' => ['nullable', 'string'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $document = VehicleDocument::query()
                ->where('user_id', $userId)
                ->findOrFail($request->input('id'));

            $this->findVehicle($document->vehicle_id, $userId);

            $data = collect($validation->validated())->except(['id', 'file', 'vehicle_id'])->all();

            if ($request->hasFile('file')) {
                DocumentStorage::delete($document->file_path);
                $data['file_path'] = DocumentStorage::store(
                    $request->file('file'),
                    "vehicles/{$userId}/{$document->vehicle_id}",
                );
            }

            $document->update($data);

            return $this->sendJsonResponse(true, 'Document updated.', [
                'document' => $document->fresh(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postVehicleDocumentDestroy(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $document = VehicleDocument::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $document->delete();

            return $this->sendJsonResponse(true, 'Document deleted.', null, 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    private function findVehicle(int $vehicleId, int $userId): Vehicle
    {
        return Vehicle::query()
            ->where('user_id', $userId)
            ->findOrFail($vehicleId);
    }
}
