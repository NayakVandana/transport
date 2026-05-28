<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    public function edit(Request $request): Response
    {
        $company = Company::query()
            ->where('user_id', $request->user()->id)
            ->first();

        return Inertia::render('Company/Edit', [
            'company' => $company,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
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

        Company::query()->updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                ...$validated,
                'user_id' => $request->user()->id,
                'entry_next_sequence' => (int) $validated['entry_next_sequence'],
            ],
        );

        return redirect()->route('company.edit')->with('success', 'Company profile saved.');
    }
}
