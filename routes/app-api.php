<?php

use App\Http\Controllers\Api\App\AuthApiController;
use App\Http\Controllers\Api\App\BookingApiController;
use App\Http\Controllers\Api\App\CompanyApiController;
use App\Http\Controllers\Api\App\CustomerApiController;
use App\Http\Controllers\Api\App\DashboardApiController;
use App\Http\Controllers\Api\App\DriverApiController;
use App\Http\Controllers\Api\App\ExpenseApiController;
use App\Http\Controllers\Api\App\FreightInvoiceApiController;
use App\Http\Controllers\Api\App\PaymentApiController;
use App\Http\Controllers\Api\App\ProfileApiController;
use App\Http\Controllers\Api\App\RouteLocationApiController;
use App\Http\Controllers\Api\App\VehicleApiController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->prefix('v1/app')->group(function () {
    Route::post('/auth/auth-logout', [AuthApiController::class, 'postAuthLogout']);

    Route::post('/profile/profile-show', [ProfileApiController::class, 'postProfileShow']);
    Route::post('/profile/profile-update', [ProfileApiController::class, 'postProfileUpdate']);
    Route::post('/profile/profile-password-update', [ProfileApiController::class, 'postProfilePasswordUpdate']);
    Route::post('/profile/profile-destroy', [ProfileApiController::class, 'postProfileDestroy']);

    Route::post('/dashboard/dashboard-summary', [DashboardApiController::class, 'postDashboardSummary']);

    Route::post('/company/company-show', [CompanyApiController::class, 'postCompanyShow']);
    Route::post('/company/company-update', [CompanyApiController::class, 'postCompanyUpdate']);

    Route::post('/customers/customers-list', [CustomerApiController::class, 'postCustomersList']);
    Route::post('/customers/customer-show', [CustomerApiController::class, 'postCustomerShow']);
    Route::post('/customers/customer-store', [CustomerApiController::class, 'postCustomerStore']);
    Route::post('/customers/customer-update', [CustomerApiController::class, 'postCustomerUpdate']);
    Route::post('/customers/customer-destroy', [CustomerApiController::class, 'postCustomerDestroy']);

    Route::post('/vehicles/vehicles-list', [VehicleApiController::class, 'postVehiclesList']);
    Route::post('/vehicles/vehicle-meta', [VehicleApiController::class, 'postVehicleMeta']);
    Route::post('/vehicles/vehicle-show', [VehicleApiController::class, 'postVehicleShow']);
    Route::post('/vehicles/vehicle-store', [VehicleApiController::class, 'postVehicleStore']);
    Route::post('/vehicles/vehicle-update', [VehicleApiController::class, 'postVehicleUpdate']);
    Route::post('/vehicles/vehicle-destroy', [VehicleApiController::class, 'postVehicleDestroy']);

    Route::post('/drivers/drivers-list', [DriverApiController::class, 'postDriversList']);
    Route::post('/drivers/driver-show', [DriverApiController::class, 'postDriverShow']);
    Route::post('/drivers/driver-store', [DriverApiController::class, 'postDriverStore']);
    Route::post('/drivers/driver-update', [DriverApiController::class, 'postDriverUpdate']);
    Route::post('/drivers/driver-destroy', [DriverApiController::class, 'postDriverDestroy']);

    Route::post('/bookings/bookings-list', [BookingApiController::class, 'postBookingsList']);
    Route::post('/bookings/booking-meta', [BookingApiController::class, 'postBookingMeta']);
    Route::post('/bookings/booking-show', [BookingApiController::class, 'postBookingShow']);
    Route::post('/bookings/booking-store', [BookingApiController::class, 'postBookingStore']);
    Route::post('/bookings/booking-update', [BookingApiController::class, 'postBookingUpdate']);
    Route::post('/bookings/booking-destroy', [BookingApiController::class, 'postBookingDestroy']);
    Route::post('/bookings/bookings-export-csv', [BookingApiController::class, 'postBookingsExportCsv']);
    Route::post('/bookings/bookings-export-pdf', [BookingApiController::class, 'postBookingsExportPdf']);

    Route::post('/expenses/expenses-list', [ExpenseApiController::class, 'postExpensesList']);
    Route::post('/expenses/expense-meta', [ExpenseApiController::class, 'postExpenseMeta']);
    Route::post('/expenses/expense-show', [ExpenseApiController::class, 'postExpenseShow']);
    Route::post('/expenses/expense-store', [ExpenseApiController::class, 'postExpenseStore']);
    Route::post('/expenses/expense-update', [ExpenseApiController::class, 'postExpenseUpdate']);
    Route::post('/expenses/expense-destroy', [ExpenseApiController::class, 'postExpenseDestroy']);

    Route::post('/payments/payments-list', [PaymentApiController::class, 'postPaymentsList']);
    Route::post('/payments/payment-meta', [PaymentApiController::class, 'postPaymentMeta']);
    Route::post('/payments/payment-show', [PaymentApiController::class, 'postPaymentShow']);
    Route::post('/payments/payment-store', [PaymentApiController::class, 'postPaymentStore']);
    Route::post('/payments/payment-update', [PaymentApiController::class, 'postPaymentUpdate']);
    Route::post('/payments/payment-destroy', [PaymentApiController::class, 'postPaymentDestroy']);

    Route::post('/routes/routes-list', [RouteLocationApiController::class, 'postRoutesList']);
    Route::post('/routes/route-store', [RouteLocationApiController::class, 'postRouteStore']);
    Route::post('/routes/route-destroy', [RouteLocationApiController::class, 'postRouteDestroy']);

    Route::post('/invoices/invoices-list', [FreightInvoiceApiController::class, 'postInvoicesList']);
    Route::post('/invoices/invoice-meta', [FreightInvoiceApiController::class, 'postInvoiceMeta']);
    Route::post('/invoices/invoice-show', [FreightInvoiceApiController::class, 'postInvoiceShow']);
    Route::post('/invoices/invoice-store', [FreightInvoiceApiController::class, 'postInvoiceStore']);
    Route::post('/invoices/invoice-update', [FreightInvoiceApiController::class, 'postInvoiceUpdate']);
    Route::post('/invoices/invoice-destroy', [FreightInvoiceApiController::class, 'postInvoiceDestroy']);
});
