<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $customers = Customer::query()
            ->where('user_id', $request->user()->id)
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Customers/Index', [
            'customers' => $customers,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Customers/Form', [
            'customer' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validated($request);
        Customer::query()->create([
            ...$validated,
            'user_id' => $request->user()->id,
        ]);

        return redirect()->route('customers.index')->with('success', 'Customer created.');
    }

    public function edit(Request $request, Customer $customer): Response
    {
        $this->authorizeCustomer($request, $customer);

        return Inertia::render('Customers/Form', [
            'customer' => $customer,
        ]);
    }

    public function update(Request $request, Customer $customer): RedirectResponse
    {
        $this->authorizeCustomer($request, $customer);
        $customer->update($this->validated($request));

        return redirect()->route('customers.index')->with('success', 'Customer updated.');
    }

    public function destroy(Request $request, Customer $customer): RedirectResponse
    {
        $this->authorizeCustomer($request, $customer);
        $customer->delete();

        return redirect()->route('customers.index')->with('success', 'Customer deleted.');
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'mobile' => ['nullable', 'string', 'max:15'],
            'address' => ['nullable', 'string'],
            'state_code' => ['nullable', 'string', 'max:5'],
        ]);
    }

    private function authorizeCustomer(Request $request, Customer $customer): void
    {
        abort_unless($customer->user_id === $request->user()->id, 403);
    }
}
