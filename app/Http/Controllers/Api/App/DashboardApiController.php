<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Customer;
use App\Models\FreightInvoice;
use Exception;
use Illuminate\Http\Request;

class DashboardApiController extends Controller
{
    public function postDashboardSummary(Request $request)
    {
        try {
            $userId = $request->user()->id;

            $stats = [
                'customers' => Customer::query()->where('user_id', $userId)->count(),
                'invoices' => FreightInvoice::query()->where('user_id', $userId)->count(),
                'outstanding' => (float) FreightInvoice::query()
                    ->where('user_id', $userId)
                    ->sum('balance_amount'),
                'has_company' => Company::query()->where('user_id', $userId)->exists(),
            ];

            $recentInvoices = FreightInvoice::query()
                ->where('user_id', $userId)
                ->with('customer:id,name')
                ->orderByDesc('invoice_date')
                ->limit(5)
                ->get(['id', 'bill_number', 'invoice_date', 'customer_id', 'balance_amount', 'status']);

            return $this->sendJsonResponse(true, 'Dashboard loaded.', [
                'stats' => $stats,
                'recentInvoices' => $recentInvoices,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }
}
