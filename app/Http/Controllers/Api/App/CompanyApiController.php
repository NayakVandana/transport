<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyDocument;
use App\Support\DocumentStorage;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Support\DocumentValidation;
use App\Support\LogoValidation;

class CompanyApiController extends Controller
{
    public function postCompanyShow(Request $request)
    {
        try {
            $company = Company::query()
                ->where('user_id', $request->user()->id)
                ->first();

            $documents = $company
                ? CompanyDocument::query()
                    ->where('user_id', $request->user()->id)
                    ->where('company_id', $company->id)
                    ->where('document_type', '!=', 'logo')
                    ->orderByDesc('created_at')
                    ->get()
                : collect();

            return $this->sendJsonResponse(true, 'Company loaded.', [
                'company' => $company,
                'documents' => $documents,
                'document_types' => DocumentValidation::companyOptionsForFrontend(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postCompanyUpdate(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'name' => ['required', 'string', 'max:255'],
                'pan' => ['nullable', 'string', 'max:20'],
                'gst' => ['nullable', 'string', 'max:20'],
                'udyam_reg_no' => ['nullable', 'string', 'max:100'],
                'udyam_date' => ['nullable', 'date'],
                'jurisdiction' => ['nullable', 'string', 'max:255'],
                'sac_code' => ['required', 'string', 'max:10'],
                'entry_number_prefix' => ['required', 'string', 'max:20'],
                'entry_next_sequence' => ['required', 'integer', 'min:1'],
                'igst_rate' => ['required', 'numeric', 'min:0', 'max:100'],
                'bank_account_name' => ['nullable', 'string', 'max:255'],
                'bank_account_no' => ['nullable', 'string', 'max:50'],
                'bank_ifsc' => ['nullable', 'string', 'max:20'],
                'bank_name' => ['nullable', 'string', 'max:255'],
                'bank_branch' => ['nullable', 'string', 'max:255'],
                'address' => ['nullable', 'string'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $validated = $validation->validated();

            $company = Company::query()->updateOrCreate(
                ['user_id' => $request->user()->id],
                [
                    ...$validated,
                    'user_id' => $request->user()->id,
                    'entry_next_sequence' => (int) $validated['entry_next_sequence'],
                ],
            );

            return $this->sendJsonResponse(true, 'Company profile saved.', [
                'company' => $company,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postCompanyLogoUpdate(Request $request)
    {
        try {
            $validation = Validator::make($request->all(), [
                'logo' => ['required_without:remove_logo', 'nullable', ...LogoValidation::fileRule()],
                'remove_logo' => ['nullable', 'boolean'],
            ]);

            if ($validation->fails()) {
                return $this->sendJsonResponse(false, $validation->errors()->first(), $validation->errors()->getMessages(), 200);
            }

            $company = Company::query()
                ->where('user_id', $request->user()->id)
                ->firstOrFail();

            if ($request->boolean('remove_logo')) {
                $company->update(['logo_path' => null]);
            } elseif ($request->hasFile('logo')) {
                $company->update([
                    'logo_path' => DocumentStorage::store(
                        $request->file('logo'),
                        "companies/{$request->user()->id}/{$company->id}/logo",
                    ),
                ]);
            }

            return $this->sendJsonResponse(true, 'Company logo updated.', [
                'company' => $company->fresh(),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }
}
