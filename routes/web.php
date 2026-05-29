<?php

use Illuminate\Foundation\Application;
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

Route::get('/company', fn () => Inertia::render('Company/Edit'))->name('company.edit');

Route::get('/customers', fn () => Inertia::render('Customers/Index'))->name('customers.index');
Route::get('/customers/create', fn () => Inertia::render('Customers/Form'))->name('customers.create');
Route::get('/customers/{id}/edit', fn (int $id) => Inertia::render('Customers/Form', ['customerId' => $id]))->name('customers.edit');

Route::get('/vehicles', fn () => Inertia::render('Vehicles/Index'))->name('vehicles.index');
Route::get('/vehicles/create', fn () => Inertia::render('Vehicles/Form'))->name('vehicles.create');
Route::get('/vehicles/{id}/edit', fn (int $id) => Inertia::render('Vehicles/Form', ['vehicleId' => $id]))->name('vehicles.edit');

Route::get('/drivers', fn () => Inertia::render('Drivers/Index'))->name('drivers.index');
Route::get('/drivers/create', fn () => Inertia::render('Drivers/Form'))->name('drivers.create');
Route::get('/drivers/{id}/edit', fn (int $id) => Inertia::render('Drivers/Form', ['driverId' => $id]))->name('drivers.edit');

Route::get('/bookings', fn () => Inertia::render('Bookings/Index'))->name('bookings.index');
Route::get('/bookings/create', fn () => Inertia::render('Bookings/Form'))->name('bookings.create');
Route::get('/bookings/{id}/edit', fn (int $id) => Inertia::render('Bookings/Form', ['bookingId' => $id]))->name('bookings.edit');

Route::get('/expenses', fn () => Inertia::render('Expenses/Index'))->name('expenses.index');
Route::get('/expenses/create', fn () => Inertia::render('Expenses/Form'))->name('expenses.create');
Route::get('/expenses/{id}/edit', fn (int $id) => Inertia::render('Expenses/Form', ['expenseId' => $id]))->name('expenses.edit');

Route::get('/payments', fn () => Inertia::render('Payments/Index'))->name('payments.index');
Route::get('/payments/create', fn () => Inertia::render('Payments/Form'))->name('payments.create');
Route::get('/payments/{id}/edit', fn (int $id) => Inertia::render('Payments/Form', ['paymentId' => $id]))->name('payments.edit');

Route::get('/routes', fn () => Inertia::render('Routes/Index'))->name('routes.index');

Route::get('/invoices', fn () => Inertia::render('Invoices/Index'))->name('invoices.index');
Route::get('/invoices/create', fn () => Inertia::render('Invoices/Form'))->name('invoices.create');
Route::get('/invoices/{id}', fn (int $id) => Inertia::render('Invoices/Show', ['invoiceId' => $id]))->name('invoices.show');
Route::get('/invoices/{id}/edit', fn (int $id) => Inertia::render('Invoices/Form', ['invoiceId' => $id]))->name('invoices.edit');
Route::get('/invoices/{id}/print', fn (int $id) => Inertia::render('Invoices/Print', ['invoiceId' => $id]))->name('invoices.print');

Route::get('/profile', fn () => Inertia::render('Profile/Edit'))->name('profile.edit');
