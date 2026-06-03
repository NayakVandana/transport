<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Party;
use App\Models\PartyDocument;
use App\Support\DocumentStorage;
use App\Support\DocumentValidation;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class PartyDocumentApiController extends Controller
{
    public function postPartyDocumentMeta(Request $request)
    {
        try {
            return $this->sendJsonResponse(true, 'Party document types loaded.', [
                'document_types' => DocumentValidation::partyOptionsForFrontend(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postPartyDocumentsList(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'party_id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $userId = (int) $request->user()->id;
            $party = $this->findParty($request->input('party_id'), $userId);

            $documents = PartyDocument::query()
                ->where('user_id', $userId)
                ->where('party_id', $party->id)
                ->orderByDesc('created_at')
                ->get();

            return $this->sendJsonResponse(true, 'Party documents loaded.', [
                'documents' => $documents,
                'document_types' => DocumentValidation::partyOptionsForFrontend(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postPartyDocumentStore(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $request->merge([
                'party_id' => $request->filled('party_id') ? (int) $request->input('party_id') : null,
                'title' => $request->input('title') ?: null,
                'notes' => $request->input('notes') ?: null,
            ]);

            $validation = Validator::make($request->all(), [
                'party_id' => [
                    'required',
                    'integer',
                    Rule::exists('parties', 'id')->where(
                        fn ($query) => $query->where('user_id', $userId),
                    ),
                ],
                'document_type' => ['required', 'string', Rule::in(DocumentValidation::partyDocumentTypes())],
                'title' => ['nullable', 'string', 'max:255'],
                'file' => ['required', ...DocumentValidation::fileRule()],
                'expiry_date' => ['nullable', 'date'],
                'notes' => ['nullable', 'string'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $party = $this->findParty($request->input('party_id'), $userId);

            $document = PartyDocument::query()->create([
                ...collect($validation->validated())->except(['file'])->all(),
                'user_id' => $userId,
                'party_id' => $party->id,
                'file_path' => DocumentStorage::store(
                    $request->file('file'),
                    "parties/{$userId}/{$party->id}",
                ),
            ]);

            return $this->sendJsonResponse(true, 'Document uploaded.', [
                'document' => $document,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postPartyDocumentDestroy(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $document = PartyDocument::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $document->delete();

            return $this->sendJsonResponse(true, 'Document deleted.', null, 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    private function findParty(int $partyId, int $userId): Party
    {
        return Party::query()
            ->where('user_id', $userId)
            ->findOrFail($partyId);
    }
}
