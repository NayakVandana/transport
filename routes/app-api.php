<?php

use App\Http\Controllers\Api\App\AuthApiController;
use App\Http\Controllers\Api\App\CompanyApiController;
use App\Http\Controllers\Api\App\PartyApiController;
use App\Http\Controllers\Api\App\DashboardApiController;
use App\Http\Controllers\Api\App\DriverApiController;
use App\Http\Controllers\Api\App\DriverDocumentApiController;
use App\Http\Controllers\Api\App\EntrybookApiController;
use App\Http\Controllers\Api\App\FreightInvoiceApiController;
use App\Http\Controllers\Api\App\InvoicePaymentApiController;
use App\Http\Controllers\Api\App\ProfileApiController;
use App\Http\Controllers\Api\App\RouteLocationApiController;
use App\Http\Controllers\Api\App\VehicleApiController;
use App\Http\Controllers\Api\App\VehicleDocumentApiController;
use App\Http\Controllers\Api\App\VehicleExpenseApiController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->prefix('v1/app')->group(function () {
    Route::post('/auth/auth-logout', [AuthApiController::class, 'postAuthLogout']);

    Route::post('/profile/profile-show', [ProfileApiController::class, 'postProfileShow']);
    Route::post('/profile/profile-update', [ProfileApiController::class, 'postProfileUpdate']);
    Route::post('/profile/profile-password-update', [ProfileApiController::class, 'postProfilePasswordUpdate']);
    Route::post('/profile/profile-destroy', [ProfileApiController::class, 'postProfileDestroy']);

    Route::post('/dashboard/dashboard-summary', [DashboardApiController::class, 'postDashboardSummary']);
    Route::post('/dashboard/dashboard-chart', [DashboardApiController::class, 'postDashboardChart']);

    Route::post('/company/company-show', [CompanyApiController::class, 'postCompanyShow']);
    Route::post('/company/company-update', [CompanyApiController::class, 'postCompanyUpdate']);

    Route::post('/parties/parties-list', [PartyApiController::class, 'postPartiesList']);
    Route::post('/parties/parties-export-csv', [PartyApiController::class, 'postPartiesExportCsv']);
    Route::post('/parties/parties-export-pdf', [PartyApiController::class, 'postPartiesExportPdf']);
    Route::post('/parties/party-show', [PartyApiController::class, 'postPartyShow']);
    Route::post('/parties/party-account', [PartyApiController::class, 'postPartyAccount']);
    Route::post('/parties/party-store', [PartyApiController::class, 'postPartyStore']);
    Route::post('/parties/party-update', [PartyApiController::class, 'postPartyUpdate']);
    Route::post('/parties/party-destroy', [PartyApiController::class, 'postPartyDestroy']);

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

    Route::post('/vehicle-expenses/vehicle-expenses-list', [VehicleExpenseApiController::class, 'postVehicleExpensesList']);
    Route::post('/vehicle-expenses/vehicle-expense-meta', [VehicleExpenseApiController::class, 'postVehicleExpenseMeta']);
    Route::post('/vehicle-expenses/vehicle-expense-show', [VehicleExpenseApiController::class, 'postVehicleExpenseShow']);
    Route::post('/vehicle-expenses/vehicle-expense-store', [VehicleExpenseApiController::class, 'postVehicleExpenseStore']);
    Route::post('/vehicle-expenses/vehicle-expense-update', [VehicleExpenseApiController::class, 'postVehicleExpenseUpdate']);
    Route::post('/vehicle-expenses/vehicle-expense-destroy', [VehicleExpenseApiController::class, 'postVehicleExpenseDestroy']);
    Route::post('/vehicle-expenses/vehicle-expenses-export-csv', [VehicleExpenseApiController::class, 'postVehicleExpensesExportCsv']);
    Route::post('/vehicle-expenses/vehicle-expenses-export-pdf', [VehicleExpenseApiController::class, 'postVehicleExpensesExportPdf']);

    Route::post('/entrybooks/entrybooks-list', [EntrybookApiController::class, 'postEntrybooksList']);
    Route::post('/entrybooks/entrybooks-export-csv', [EntrybookApiController::class, 'postEntrybooksExportCsv']);
    Route::post('/entrybooks/entrybooks-export-pdf', [EntrybookApiController::class, 'postEntrybooksExportPdf']);
    Route::post('/entrybooks/entrybook-meta', [EntrybookApiController::class, 'postEntrybookMeta']);
    Route::post('/entrybooks/entrybook-show', [EntrybookApiController::class, 'postEntrybookShow']);
    Route::post('/entrybooks/entrybook-store', [EntrybookApiController::class, 'postEntrybookStore']);
    Route::post('/entrybooks/entrybook-update', [EntrybookApiController::class, 'postEntrybookUpdate']);
    Route::post('/entrybooks/entrybook-destroy', [EntrybookApiController::class, 'postEntrybookDestroy']);

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
    Route::post('/invoices/invoice-download-pdf', [FreightInvoiceApiController::class, 'postInvoiceDownloadPdf']);
    Route::post('/invoices/invoice-store', [FreightInvoiceApiController::class, 'postInvoiceStore']);
    Route::post('/invoices/invoice-update', [FreightInvoiceApiController::class, 'postInvoiceUpdate']);
    Route::post('/invoices/invoice-destroy', [FreightInvoiceApiController::class, 'postInvoiceDestroy']);

    Route::post('/invoice-payments/invoice-payments-list', [InvoicePaymentApiController::class, 'postInvoicePaymentsList']);
    Route::post('/invoice-payments/invoice-payment-meta', [InvoicePaymentApiController::class, 'postInvoicePaymentMeta']);
    Route::post('/invoice-payments/invoice-payment-show', [InvoicePaymentApiController::class, 'postInvoicePaymentShow']);
    Route::post('/invoice-payments/invoice-payment-store', [InvoicePaymentApiController::class, 'postInvoicePaymentStore']);
    Route::post('/invoice-payments/invoice-payment-update', [InvoicePaymentApiController::class, 'postInvoicePaymentUpdate']);
    Route::post('/invoice-payments/invoice-payment-destroy', [InvoicePaymentApiController::class, 'postInvoicePaymentDestroy']);
    Route::post('/invoice-payments/invoice-payments-export-csv', [InvoicePaymentApiController::class, 'postInvoicePaymentsExportCsv']);
    Route::post('/invoice-payments/invoice-payments-export-pdf', [InvoicePaymentApiController::class, 'postInvoicePaymentsExportPdf']);
});
