<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\FreightInvoice;
use App\Models\Party;
use Exception;
use Illuminate\Http\Request;

class DashboardApiController extends Controller
{
    public function postDashboardSummary(Request $request)
    {
        try {
            $userId = $request->user()->id;

            $stats = [
                'parties' => Party::query()->where('user_id', $userId)->count(),
                'invoices' => FreightInvoice::query()->where('user_id', $userId)->count(),
                'outstanding' => (float) FreightInvoice::query()
                    ->where('user_id', $userId)
                    ->sum('balance_amount'),
                'has_company' => Company::query()->where('user_id', $userId)->exists(),
            ];

            $recentInvoices = FreightInvoice::query()
                ->where('user_id', $userId)
                ->with('party:id,name')
                ->orderByDesc('invoice_date')
                ->limit(5)
                ->get(['id', 'bill_number', 'invoice_date', 'party_id', 'balance_amount', 'status']);

            return $this->sendJsonResponse(true, 'Dashboard loaded.', [
                'stats' => $stats,
                'recentInvoices' => $recentInvoices,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }
}
