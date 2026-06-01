<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\DriverDocument;
use App\Support\DocumentStorage;
use App\Support\DocumentValidation;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class DriverDocumentApiController extends Controller
{
    public function postDriverDocumentsList(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'driver_id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $userId = (int) $request->user()->id;
            $driver = $this->findDriver($request->input('driver_id'), $userId);

            $documents = DriverDocument::query()
                ->where('user_id', $userId)
                ->where('driver_id', $driver->id)
                ->orderByDesc('created_at')
                ->get();

            return $this->sendJsonResponse(true, 'Driver documents loaded.', [
                'documents' => $documents,
                'document_types' => DocumentValidation::driverOptionsForFrontend(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postDriverDocumentStore(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $request->merge([
                'driver_id' => $request->filled('driver_id') ? (int) $request->input('driver_id') : null,
                'title' => $request->input('title') ?: null,
                'notes' => $request->input('notes') ?: null,
            ]);

            $validation = Validator::make($request->all(), [
                'driver_id' => [
                    'required',
                    'integer',
                    Rule::exists('drivers', 'id')->where(
                        fn ($query) => $query->where('user_id', $userId)->whereNull('deleted_at'),
                    ),
                ],
                'document_type' => ['required', 'string', Rule::in(DocumentValidation::driverDocumentTypes())],
                'title' => ['nullable', 'string', 'max:255'],
                'file' => ['required', DocumentValidation::fileRule()],
                'expiry_date' => ['nullable', 'date'],
                'notes' => ['nullable', 'string'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $driver = $this->findDriver($request->input('driver_id'), $userId);

            $document = DriverDocument::query()->create([
                ...collect($validation->validated())->except(['file'])->all(),
                'user_id' => $userId,
                'driver_id' => $driver->id,
                'file_path' => DocumentStorage::store(
                    $request->file('file'),
                    "drivers/{$userId}/{$driver->id}",
                ),
            ]);

            return $this->sendJsonResponse(true, 'Document uploaded.', [
                'document' => $document,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postDriverDocumentUpdate(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $request->merge([
                'driver_id' => $request->filled('driver_id') ? (int) $request->input('driver_id') : null,
                'title' => $request->input('title') ?: null,
                'notes' => $request->input('notes') ?: null,
            ]);

            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
                'driver_id' => [
                    'required',
                    'integer',
                    Rule::exists('drivers', 'id')->where(
                        fn ($query) => $query->where('user_id', $userId)->whereNull('deleted_at'),
                    ),
                ],
                'document_type' => ['required', 'string', Rule::in(DocumentValidation::driverDocumentTypes())],
                'title' => ['nullable', 'string', 'max:255'],
                'file' => ['nullable', DocumentValidation::fileRule()],
                'expiry_date' => ['nullable', 'date'],
                'notes' => ['nullable', 'string'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $document = DriverDocument::query()
                ->where('user_id', $userId)
                ->findOrFail($request->input('id'));

            $this->findDriver($document->driver_id, $userId);

            $data = collect($validation->validated())->except(['id', 'file', 'driver_id'])->all();

            if ($request->hasFile('file')) {
                DocumentStorage::delete($document->file_path);
                $data['file_path'] = DocumentStorage::store(
                    $request->file('file'),
                    "drivers/{$userId}/{$document->driver_id}",
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

    public function postDriverDocumentDestroy(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $document = DriverDocument::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $document->delete();

            return $this->sendJsonResponse(true, 'Document deleted.', null, 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    private function findDriver(int $driverId, int $userId): Driver
    {
        return Driver::query()
            ->where('user_id', $userId)
            ->findOrFail($driverId);
    }
}
