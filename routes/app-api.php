<?php

use App\Http\Controllers\Api\App\AuthApiController;
use App\Http\Controllers\Api\App\BookingApiController;
use App\Http\Controllers\Api\App\CompanyApiController;
use App\Http\Controllers\Api\App\CustomerApiController;
use App\Http\Controllers\Api\App\DashboardApiController;
use App\Http\Controllers\Api\App\DriverApiController;
use App\Http\Controllers\Api\App\DriverDocumentApiController;
use App\Http\Controllers\Api\App\FreightInvoiceApiController;
use App\Http\Controllers\Api\App\ProfileApiController;
use App\Http\Controllers\Api\App\RouteLocationApiController;
use App\Http\Controllers\Api\App\VehicleApiController;
use App\Http\Controllers\Api\App\VehicleDocumentApiController;
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
    Route::post('/customers/customers-export-csv', [CustomerApiController::class, 'postCustomersExportCsv']);
    Route::post('/customers/customers-export-pdf', [CustomerApiController::class, 'postCustomersExportPdf']);
    Route::post('/customers/customer-show', [CustomerApiController::class, 'postCustomerShow']);
    Route::post('/customers/customer-store', [CustomerApiController::class, 'postCustomerStore']);
    Route::post('/customers/customer-update', [CustomerApiController::class, 'postCustomerUpdate']);
    Route::post('/customers/customer-destroy', [CustomerApiController::class, 'postCustomerDestroy']);

    Route::post('/vehicles/vehicles-list', [VehicleApiController::class, 'postVehiclesList']);
    Route::post('/vehicles/vehicles-export-csv', [VehicleApiController::class, 'postVehiclesExportCsv']);
    Route::post('/vehicles/vehicles-export-pdf', [VehicleApiController::class, 'postVehiclesExportPdf']);
    Route::post('/vehicles/vehicle-meta', [VehicleApiController::class, 'postVehicleMeta']);
    Route::post('/vehicles/vehicle-show', [VehicleApiController::class, 'postVehicleShow']);
    Route::post('/vehicles/vehicle-store', [VehicleApiController::class, 'postVehicleStore']);
    Route::post('/vehicles/vehicle-update', [VehicleApiController::class, 'postVehicleUpdate']);
    Route::post('/vehicles/vehicle-destroy', [VehicleApiController::class, 'postVehicleDestroy']);

    Route::post('/vehicles/vehicle-documents-list', [VehicleDocumentApiController::class, 'postVehicleDocumentsList']);
    Route::post('/vehicles/vehicle-document-store', [VehicleDocumentApiController::class, 'postVehicleDocumentStore']);
    Route::post('/vehicles/vehicle-document-update', [VehicleDocumentApiController::class, 'postVehicleDocumentUpdate']);
    Route::post('/vehicles/vehicle-document-destroy', [VehicleDocumentApiController::class, 'postVehicleDocumentDestroy']);

    Route::post('/drivers/drivers-list', [DriverApiController::class, 'postDriversList']);
    Route::post('/drivers/drivers-export-csv', [DriverApiController::class, 'postDriversExportCsv']);
    Route::post('/drivers/drivers-export-pdf', [DriverApiController::class, 'postDriversExportPdf']);
    Route::post('/drivers/driver-meta', [DriverApiController::class, 'postDriverMeta']);
    Route::post('/drivers/driver-show', [DriverApiController::class, 'postDriverShow']);
    Route::post('/drivers/driver-store', [DriverApiController::class, 'postDriverStore']);
    Route::post('/drivers/driver-update', [DriverApiController::class, 'postDriverUpdate']);
    Route::post('/drivers/driver-destroy', [DriverApiController::class, 'postDriverDestroy']);

    Route::post('/drivers/driver-documents-list', [DriverDocumentApiController::class, 'postDriverDocumentsList']);
    Route::post('/drivers/driver-document-store', [DriverDocumentApiController::class, 'postDriverDocumentStore']);
    Route::post('/drivers/driver-document-update', [DriverDocumentApiController::class, 'postDriverDocumentUpdate']);
    Route::post('/drivers/driver-document-destroy', [DriverDocumentApiController::class, 'postDriverDocumentDestroy']);

    Route::post('/bookings/bookings-list', [BookingApiController::class, 'postBookingsList']);
    Route::post('/bookings/booking-meta', [BookingApiController::class, 'postBookingMeta']);
    Route::post('/bookings/booking-show', [BookingApiController::class, 'postBookingShow']);
    Route::post('/bookings/booking-store', [BookingApiController::class, 'postBookingStore']);
    Route::post('/bookings/booking-update', [BookingApiController::class, 'postBookingUpdate']);
    Route::post('/bookings/booking-destroy', [BookingApiController::class, 'postBookingDestroy']);
    Route::post('/bookings/bookings-export-csv', [BookingApiController::class, 'postBookingsExportCsv']);
    Route::post('/bookings/bookings-export-pdf', [BookingApiController::class, 'postBookingsExportPdf']);

    Route::post('/routes/routes-list', [RouteLocationApiController::class, 'postRoutesList']);
    Route::post('/routes/routes-export-csv', [RouteLocationApiController::class, 'postRoutesExportCsv']);
    Route::post('/routes/routes-export-pdf', [RouteLocationApiController::class, 'postRoutesExportPdf']);
    Route::post('/routes/route-store', [RouteLocationApiController::class, 'postRouteStore']);
    Route::post('/routes/route-destroy', [RouteLocationApiController::class, 'postRouteDestroy']);

    Route::post('/invoices/invoices-list', [FreightInvoiceApiController::class, 'postInvoicesList']);
    Route::post('/invoices/invoices-export-csv', [FreightInvoiceApiController::class, 'postInvoicesExportCsv']);
    Route::post('/invoices/invoices-export-pdf', [FreightInvoiceApiController::class, 'postInvoicesExportPdf']);
    Route::post('/invoices/invoice-meta', [FreightInvoiceApiController::class, 'postInvoiceMeta']);
    Route::post('/invoices/invoice-show', [FreightInvoiceApiController::class, 'postInvoiceShow']);
    Route::post('/invoices/invoice-store', [FreightInvoiceApiController::class, 'postInvoiceStore']);
    Route::post('/invoices/invoice-update', [FreightInvoiceApiController::class, 'postInvoiceUpdate']);
    Route::post('/invoices/invoice-destroy', [FreightInvoiceApiController::class, 'postInvoiceDestroy']);
});
