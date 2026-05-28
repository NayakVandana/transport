<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Customer;
use App\Models\FreightInvoice;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
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

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'recentInvoices' => $recentInvoices,
        ]);
    }
}
