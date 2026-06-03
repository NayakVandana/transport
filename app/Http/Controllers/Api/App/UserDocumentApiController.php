<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\UserDocument;
use App\Support\DocumentStorage;
use App\Support\DocumentValidation;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UserDocumentApiController extends Controller
{
    public function postUserDocumentsList(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;

            $documents = UserDocument::query()
                ->where('user_id', $userId)
                ->orderByDesc('created_at')
                ->get();

            return $this->sendJsonResponse(true, 'User documents loaded.', [
                'documents' => $documents,
                'document_types' => DocumentValidation::userOptionsForFrontend(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postUserDocumentStore(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $request->merge([
                'title' => $request->input('title') ?: null,
                'notes' => $request->input('notes') ?: null,
            ]);

            $validation = Validator::make($request->all(), [
                'document_type' => ['required', 'string', Rule::in(DocumentValidation::userDocumentTypes())],
                'title' => ['nullable', 'string', 'max:255'],
                'file' => ['required', ...DocumentValidation::fileRule()],
                'expiry_date' => ['nullable', 'date'],
                'notes' => ['nullable', 'string'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $document = UserDocument::query()->create([
                ...collect($validation->validated())->except(['file'])->all(),
                'user_id' => $userId,
                'file_path' => DocumentStorage::store(
                    $request->file('file'),
                    "users/{$userId}",
                ),
            ]);

            return $this->sendJsonResponse(true, 'Document uploaded.', [
                'document' => $document,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postUserDocumentDestroy(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $document = UserDocument::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $document->delete();

            return $this->sendJsonResponse(true, 'Document deleted.', null, 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }
}
