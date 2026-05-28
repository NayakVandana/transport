<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Customer;
use App\Models\FreightInvoice;
use App\Models\RouteLocation;
use App\Models\Vehicle;
use App\Support\AmountInWords;
use App\Support\EntryNumberGenerator;
use App\Support\FreightInvoiceCalculator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FreightInvoiceController extends Controller
{
    public function index(Request $request): Response
    {
        $invoices = FreightInvoice::query()
            ->where('user_id', $request->user()->id)
            ->with(['customer:id,name', 'company:id,name'])
            ->orderByDesc('invoice_date')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Invoices/Index', [
            'invoices' => $invoices,
        ]);
    }

    public function create(Request $request): Response|RedirectResponse
    {
        $company = $this->requireCompany($request);
        if ($company instanceof RedirectResponse) {
            return $company;
        }

        return Inertia::render('Invoices/Form', [
            ...$this->formLookups($request, $company),
            'invoice' => null,
            'nextBillNumber' => $this->suggestBillNumber($request),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $company = $this->requireCompany($request);
        if ($company instanceof RedirectResponse) {
            return $company;
        }
        $validated = $this->validatedInvoice($request);
        $lines = $validated['lines'];
        unset($validated['lines']);

        [$totals, $lineFreights] = FreightInvoiceCalculator::forPersistence(
            $lines,
            (float) $company->igst_rate,
        );

        $invoice = DB::transaction(function () use ($request, $company, $validated, $lines, $totals, $lineFreights) {
            $invoice = FreightInvoice::query()->create([
                ...$validated,
                'user_id' => $request->user()->id,
                'company_id' => $company->id,
                'sac_code' => $validated['sac_code'] ?? $company->sac_code,
                'igst_rate' => $company->igst_rate,
                ...$totals,
                'balance_in_words' => AmountInWords::rupees($totals['balance_amount']),
            ]);

            $this->syncLines($invoice, $lines, $lineFreights);

            return $invoice;
        });

        EntryNumberGenerator::syncCompanySequence(
            $company,
            collect($lines)->pluck('entry_number')->filter()->all(),
        );

        return redirect()->route('invoices.show', $invoice)->with('success', 'Invoice created.');
    }

    public function show(Request $request, FreightInvoice $invoice): Response
    {
        $this->authorizeInvoice($request, $invoice);

        $invoice->load(['company', 'customer', 'lines']);

        return Inertia::render('Invoices/Show', [
            'invoice' => $invoice,
        ]);
    }

    public function edit(Request $request, FreightInvoice $invoice): Response
    {
        $this->authorizeInvoice($request, $invoice);
        $invoice->load(['lines', 'company']);

        return Inertia::render('Invoices/Form', [
            ...$this->formLookups($request, $invoice->company),
            'invoice' => $invoice,
            'nextBillNumber' => null,
        ]);
    }

    public function update(Request $request, FreightInvoice $invoice): RedirectResponse
    {
        $this->authorizeInvoice($request, $invoice);
        $company = $invoice->company;
        $validated = $this->validatedInvoice($request, $invoice->id);
        $lines = $validated['lines'];
        unset($validated['lines']);

        [$totals, $lineFreights] = FreightInvoiceCalculator::forPersistence(
            $lines,
            (float) $company->igst_rate,
        );

        DB::transaction(function () use ($invoice, $validated, $lines, $totals, $lineFreights) {
            $invoice->update([
                ...$validated,
                ...$totals,
                'balance_in_words' => AmountInWords::rupees($totals['balance_amount']),
            ]);

            $invoice->lines()->delete();
            $this->syncLines($invoice, $lines, $lineFreights);
        });

        EntryNumberGenerator::syncCompanySequence(
            $invoice->company,
            collect($lines)->pluck('entry_number')->filter()->all(),
        );

        return redirect()->route('invoices.show', $invoice)->with('success', 'Invoice updated.');
    }

    public function destroy(Request $request, FreightInvoice $invoice): RedirectResponse
    {
        $this->authorizeInvoice($request, $invoice);
        $invoice->delete();

        return redirect()->route('invoices.index')->with('success', 'Invoice deleted.');
    }

    public function print(Request $request, FreightInvoice $invoice): Response
    {
        $this->authorizeInvoice($request, $invoice);
        $invoice->load(['company', 'customer', 'lines']);

        return Inertia::render('Invoices/Print', [
            'invoice' => $invoice,
        ]);
    }

    private function requireCompany(Request $request): Company|RedirectResponse
    {
        $company = Company::query()->where('user_id', $request->user()->id)->first();

        if (! $company) {
            return redirect()
                ->route('company.edit')
                ->with('error', 'Set up your company profile before creating invoices.');
        }

        return $company;
    }

    /** @return array<string, mixed> */
    private function formLookups(Request $request, Company $company): array
    {
        $userId = $request->user()->id;
        $nextSequence = EntryNumberGenerator::resolveNextSequence($company);

        return [
            'company' => $company,
            'customers' => $this->customersForUser($request),
            'vehicles' => Vehicle::query()->forUser($userId)->orderBy('number')->get(['id', 'number']),
            'routeLocations' => RouteLocation::query()->forUser($userId)->orderBy('name')->get(['id', 'name']),
            'entrySettings' => [
                'prefix' => $company->entry_number_prefix,
                'nextSequence' => $nextSequence,
            ],
        ];
    }

    /** @return \Illuminate\Database\Eloquent\Collection<int, Customer> */
    private function customersForUser(Request $request)
    {
        return Customer::query()
            ->where('user_id', $request->user()->id)
            ->orderBy('name')
            ->get(['id', 'name', 'mobile', 'address', 'state_code']);
    }

    private function suggestBillNumber(Request $request): string
    {
        $year = now()->format('y');
        $prefix = 'R'.now()->format('y').(now()->month >= 4 ? now()->addYear()->format('y') : $year);

        $last = FreightInvoice::query()
            ->where('user_id', $request->user()->id)
            ->where('bill_number', 'like', $prefix.'-%')
            ->orderByDesc('bill_number')
            ->value('bill_number');

        $seq = 1;
        if ($last && preg_match('/-(\d+)$/', $last, $m)) {
            $seq = (int) $m[1] + 1;
        }

        return sprintf('%s-%04d', $prefix, $seq);
    }

    /** @param  list<array<string, mixed>>  $lines
     * @param  list<float>  $freights
     */
    private function syncLines(FreightInvoice $invoice, array $lines, array $freights): void
    {
        foreach ($lines as $index => $line) {
            $invoice->lines()->create([
                'serial_number' => $index + 1,
                'entry_number' => $line['entry_number'] ?? null,
                'entry_date' => $line['entry_date'] ?? null,
                'vehicle_number' => $line['vehicle_number'] ?? null,
                'route_from' => $line['route_from'] ?? null,
                'product_name' => $line['product_name'] ?? null,
                'weight' => $line['weight'] ?? 1,
                'rate' => $line['rate'] ?? 0,
                'freight' => $freights[$index] ?? 0,
                'advance_paid' => $line['advance_paid'] ?? 0,
                'empty_container_charge' => $line['empty_container_charge'] ?? 0,
            ]);
        }
    }

    /** @return array<string, mixed> */
    private function validatedInvoice(Request $request, ?int $ignoreId = null): array
    {
        $billUnique = 'unique:freight_invoices,bill_number';
        if ($ignoreId) {
            $billUnique .= ','.$ignoreId;
        }

        $rules = [
            'customer_id' => ['required', 'exists:customers,id'],
            'bill_number' => ['required', 'string', 'max:50', $billUnique],
            'invoice_date' => ['required', 'date'],
            'sac_code' => ['nullable', 'string', 'max:10'],
            'status' => ['required', 'in:draft,finalized'],
            'prepared_by' => ['nullable', 'string', 'max:100'],
            'checked_by' => ['nullable', 'string', 'max:100'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.entry_number' => ['nullable', 'string', 'max:50'],
            'lines.*.entry_date' => ['nullable', 'date'],
            'lines.*.vehicle_number' => ['nullable', 'string', 'max:20'],
            'lines.*.route_from' => ['nullable', 'string', 'max:255'],
            'lines.*.product_name' => ['nullable', 'string', 'max:255'],
            'lines.*.weight' => ['required', 'numeric', 'min:0'],
            'lines.*.rate' => ['required', 'numeric', 'min:0'],
            'lines.*.advance_paid' => ['nullable', 'numeric', 'min:0'],
            'lines.*.empty_container_charge' => ['nullable', 'numeric', 'min:0'],
        ];

        $validated = $request->validate($rules);

        $customer = Customer::query()->find($validated['customer_id']);
        abort_unless($customer && $customer->user_id === $request->user()->id, 403);

        return $validated;
    }

    private function authorizeInvoice(Request $request, FreightInvoice $invoice): void
    {
        abort_unless($invoice->user_id === $request->user()->id, 403);
    }
}
