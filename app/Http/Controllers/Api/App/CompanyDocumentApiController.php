<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyDocument;
use App\Support\DocumentStorage;
use App\Support\DocumentValidation;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class CompanyDocumentApiController extends Controller
{
    public function postCompanyDocumentsList(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'company_id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $userId = (int) $request->user()->id;
            $company = $this->findCompany($request->input('company_id'), $userId);

            $documents = CompanyDocument::query()
                ->where('user_id', $userId)
                ->where('company_id', $company->id)
                ->where('document_type', '!=', 'logo')
                ->orderByDesc('created_at')
                ->get();

            return $this->sendJsonResponse(true, 'Company documents loaded.', [
                'documents' => $documents,
                'document_types' => DocumentValidation::companyOptionsForFrontend(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postCompanyDocumentStore(Request $request)
    {
        try {
            $userId = (int) $request->user()->id;
            $request->merge([
                'company_id' => $request->filled('company_id') ? (int) $request->input('company_id') : null,
                'title' => $request->input('title') ?: null,
                'notes' => $request->input('notes') ?: null,
            ]);

            $validation = Validator::make($request->all(), [
                'company_id' => [
                    'required',
                    'integer',
                    Rule::exists('companies', 'id')->where(
                        fn ($query) => $query->where('user_id', $userId),
                    ),
                ],
                'document_type' => ['required', 'string', Rule::in(DocumentValidation::companyDocumentTypes())],
                'title' => ['nullable', 'string', 'max:255'],
                'file' => ['required', ...DocumentValidation::fileRule()],
                'expiry_date' => ['nullable', 'date'],
                'notes' => ['nullable', 'string'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $company = $this->findCompany($request->input('company_id'), $userId);

            $document = CompanyDocument::query()->create([
                ...collect($validation->validated())->except(['file'])->all(),
                'user_id' => $userId,
                'company_id' => $company->id,
                'file_path' => DocumentStorage::store(
                    $request->file('file'),
                    "companies/{$userId}/{$company->id}",
                ),
            ]);

            return $this->sendJsonResponse(true, 'Document uploaded.', [
                'document' => $document,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postCompanyDocumentDestroy(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'id' => ['required', 'integer'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $document = CompanyDocument::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($request->input('id'));

            $document->delete();

            return $this->sendJsonResponse(true, 'Document deleted.', null, 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    private function findCompany(int $companyId, int $userId): Company
    {
        return Company::query()
            ->where('user_id', $userId)
            ->findOrFail($companyId);
    }
}
