<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web — Inertia page shells only (GET, no DB / no business logic).
|--------------------------------------------------------------------------
|
| Browser and mobile app share the same JSON API:
|   /api/v1/...       guest (login, register)
|   /api/v1/app/...   auth:sanctum — authenticated app data
|
| Pass route params (id) into the page; React loads data via API.
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
})->name('home');

require __DIR__.'/auth.php';

Route::get('/dashboard', fn () => Inertia::render('Dashboard'))->name('dashboard');

Route::get('/company', fn () => Inertia::render('Company/Show'))->name('company.show');
Route::get('/company/edit', fn () => Inertia::render('Company/Edit'))->name('company.edit');

Route::get('/parties', fn () => Inertia::render('Parties/Index'))->name('parties.index');
Route::get('/parties/create', fn () => Inertia::render('Parties/Form'))->name('parties.create');
Route::get('/parties/{id}', fn (int $id) => redirect()->route('parties.overview', $id))->name('parties.show');
Route::get('/parties/{id}/overview', fn (int $id) => Inertia::render('Parties/Show', ['partyId' => $id, 'activeTab' => 'overview']))->name('parties.overview');
Route::get('/parties/{id}/ledger', fn (int $id) => Inertia::render('Parties/Show', ['partyId' => $id, 'activeTab' => 'ledger']))->name('parties.ledger');
Route::get('/parties/{id}/invoices', fn (int $id) => Inertia::render('Parties/Show', ['partyId' => $id, 'activeTab' => 'invoices']))->name('parties.invoices');
Route::get('/parties/{id}/entries', fn (int $id) => Inertia::render('Parties/Show', ['partyId' => $id, 'activeTab' => 'entries']))->name('parties.entries');
Route::get('/parties/{id}/loading-slips', fn (int $id) => Inertia::render('Parties/Show', ['partyId' => $id, 'activeTab' => 'loading-slips']))->name('parties.loading-slips');
Route::get('/parties/{id}/payments', fn (int $id) => Inertia::render('Parties/Show', ['partyId' => $id, 'activeTab' => 'payments']))->name('parties.payments');
Route::get('/parties/{id}/profile', fn (int $id) => Inertia::render('Parties/ProfileShow', ['partyId' => $id]))->name('parties.profile');
Route::get('/parties/{id}/edit', fn (int $id) => Inertia::render('Parties/Form', ['partyId' => $id]))->name('parties.edit');

Route::get('/vehicles', fn () => Inertia::render('Vehicles/Index'))->name('vehicles.index');
Route::get('/vehicles/create', fn () => Inertia::render('Vehicles/Form'))->name('vehicles.create');
Route::get('/vehicles/{id}', fn (int $id) => Inertia::render('Vehicles/Show', ['vehicleId' => $id]))->name('vehicles.show');
Route::get('/vehicles/{id}/edit', fn (int $id) => Inertia::render('Vehicles/Form', ['vehicleId' => $id]))->name('vehicles.edit');

Route::get('/drivers', fn () => Inertia::render('Drivers/Index'))->name('drivers.index');
Route::get('/drivers/create', fn () => Inertia::render('Drivers/Form'))->name('drivers.create');
Route::get('/drivers/{id}', fn (int $id) => Inertia::render('Drivers/Show', ['driverId' => $id]))->name('drivers.show');
Route::get('/drivers/{id}/edit', fn (int $id) => Inertia::render('Drivers/Form', ['driverId' => $id]))->name('drivers.edit');

Route::get('/vehicle-expenses', fn () => Inertia::render('VehicleExpenses/Index'))->name('vehicle-expenses.index');
Route::get('/vehicle-expenses/create', fn () => Inertia::render('VehicleExpenses/Form'))->name('vehicle-expenses.create');
Route::get('/vehicle-expenses/{id}/edit', fn (int $id) => Inertia::render('VehicleExpenses/Form', ['vehicleExpenseId' => $id]))->name('vehicle-expenses.edit');

Route::get('/entrybooks', fn () => Inertia::render('Entrybooks/Index'))->name('entrybooks.index');
Route::get('/entrybooks/create', fn () => Inertia::render('Entrybooks/Form'))->name('entrybooks.create');
Route::get('/entrybooks/{id}/edit', fn (int $id) => Inertia::render('Entrybooks/Form', ['entrybookId' => $id]))->name('entrybooks.edit');

Route::get('/daily-reports', fn () => Inertia::render('DailyReports/Index'))->name('daily-reports.index');
Route::get('/daily-reports/create', function (Request $request) {
    return Inertia::render('DailyReports/Form', [
        'vehicleId' => is_numeric($request->query('vehicle')) ? (int) $request->query('vehicle') : null,
        'reportDate' => is_string($request->query('date')) ? $request->query('date') : null,
    ]);
})->name('daily-reports.create');
Route::get('/daily-reports/{id}/edit', fn (int $id) => Inertia::render('DailyReports/Form', ['dailyReportId' => $id]))->name('daily-reports.edit');

Route::get('/loading-slips', fn () => Inertia::render('LoadingSlips/Index'))->name('loading-slips.index');
Route::get('/loading-slips/create', fn () => Inertia::render('LoadingSlips/Form'))->name('loading-slips.create');
Route::get('/loading-slips/{id}', fn (int $id) => Inertia::render('LoadingSlips/Show', ['loadingSlipId' => $id]))->name('loading-slips.show');
Route::get('/loading-slips/{id}/edit', fn (int $id) => Inertia::render('LoadingSlips/Form', ['loadingSlipId' => $id]))->name('loading-slips.edit');

Route::get('/locations', fn () => Inertia::render('Locations/Index'))->name('locations.index');
Route::get('/locations/create', fn () => Inertia::render('Locations/Form'))->name('locations.create');

Route::get('/invoices', fn () => Inertia::render('Invoices/Index'))->name('invoices.index');
Route::get('/invoices/create', function (Request $request) {
    $party = $request->query('party');
    $entrybook = $request->query('entrybook');

    return Inertia::render('Invoices/Form', [
        'partyId' => is_numeric($party) ? (int) $party : null,
        'entrybookId' => is_numeric($entrybook) ? (int) $entrybook : null,
    ]);
})->name('invoices.create');
Route::get('/invoices/{id}', fn (int $id) => Inertia::render('Invoices/Show', ['invoiceId' => $id]))->name('invoices.show');
Route::get('/invoices/{id}/edit', fn (int $id) => Inertia::render('Invoices/Form', ['invoiceId' => $id]))->name('invoices.edit');

Route::get('/invoice-payments', fn () => Inertia::render('InvoicePayments/Index'))->name('invoice-payments.index');
Route::get('/invoice-payments/create', function (Request $request) {
    $party = $request->query('party');
    $invoice = $request->query('invoice');

    $partyId = is_numeric($party) ? (int) $party : null;

    if ($partyId === null && is_numeric($invoice)) {
        $partyId = \App\Models\FreightInvoice::query()
            ->whereKey((int) $invoice)
            ->value('party_id');
    }

    return Inertia::render('InvoicePayments/Form', [
        'partyId' => $partyId,
        'invoiceId' => is_numeric($invoice) ? (int) $invoice : null,
    ]);
})->name('invoice-payments.create');

Route::get('/profile', fn () => Inertia::render('Profile/Show'))->name('profile.show');
Route::get('/profile/edit', fn () => Inertia::render('Profile/Edit'))->name('profile.edit');
