<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\FreightInvoice;
use App\Models\InvoicePayment;
use App\Models\Party;
use App\Support\InvoicePaymentCalculator;
use App\Support\ListFilter;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;

class DashboardApiController extends Controller
{
    private const CHART_PERIOD_LIMIT = 12;

    public function postDashboardSummary(Request $request)
    {
        try {
            $userId = $request->user()->id;

            $stats = [
                'parties' => Party::query()->where('user_id', $userId)->count(),
                'invoices' => FreightInvoice::query()->where('user_id', $userId)->count(),
                'balance_due' => round((float) FreightInvoice::query()->where('user_id', $userId)->sum('balance_amount'), 2),
                'received' => round((float) InvoicePayment::query()->where('user_id', $userId)->sum('amount'), 2),
                'outstanding' => InvoicePaymentCalculator::totalOutstanding($userId),
                'has_company' => Company::query()->where('user_id', $userId)->exists(),
            ];

            $recentInvoices = FreightInvoice::query()
                ->where('user_id', $userId)
                ->with('party:id,name')
                ->orderByDesc('created_at')
                ->limit(5)
                ->get(['id', 'bill_number', 'invoice_date', 'party_id', 'balance_amount', 'status', 'created_at']);

            InvoicePaymentCalculator::attachSummariesToInvoices($recentInvoices);

            return $this->sendJsonResponse(true, 'Dashboard loaded.', [
                'stats' => $stats,
                'recentInvoices' => $recentInvoices,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    public function postDashboardChart(Request $request)
    {
        try {
            $userId = $request->user()->id;
            $dateFilters = ListFilter::dateFromRequest($request);
            $granularity = $this->chartGranularity($dateFilters);

            $invoiceQuery = FreightInvoice::query()->where('user_id', $userId);
            ListFilter::applyDate($invoiceQuery, $dateFilters, 'invoice_date');

            $paymentQuery = InvoicePayment::query()->where('user_id', $userId);
            ListFilter::applyDate($paymentQuery, $dateFilters, 'payment_date');

            $balanceDue = round((float) (clone $invoiceQuery)->sum('balance_amount'), 2);
            $received = round((float) (clone $paymentQuery)->sum('amount'), 2);
            $outstanding = max(0, round($balanceDue - $received, 2));

            $series = $this->buildChartSeries($userId, $dateFilters, $granularity);

            $filterSummary = ListFilter::summary(
                [ListFilter::dateSummary($dateFilters)],
                'All records',
            );

            return $this->sendJsonResponse(true, 'Dashboard chart loaded.', [
                'summary' => [
                    'balance_due' => $balanceDue,
                    'received' => $received,
                    'outstanding' => $outstanding,
                    'invoice_count' => (clone $invoiceQuery)->count(),
                    'payment_count' => (clone $paymentQuery)->count(),
                ],
                'series' => $series,
                'granularity' => $granularity,
                'filters' => $dateFilters,
                'filterSummary' => $filterSummary,
            ], 200);
        } catch (Exception $e) {
            return $this->sendError($e);
        }
    }

    /** @param  array{date_range: string, date_from: string, date_to: string}  $dateFilters */
    private function chartGranularity(array $dateFilters): string
    {
        $dateRange = $dateFilters['date_range'] ?? 'all';

        if (in_array($dateRange, ['today', 'yesterday'], true)) {
            return 'day';
        }

        if ($dateFilters['date_from'] && $dateFilters['date_to']) {
            $from = Carbon::parse($dateFilters['date_from']);
            $to = Carbon::parse($dateFilters['date_to']);

            if ($from->diffInDays($to) <= 31) {
                return 'day';
            }
        }

        return 'month';
    }

    /**
     * @param  array{date_range: string, date_from: string, date_to: string}  $dateFilters
     * @return list<array{key: string, label: string, balance_due: float, received: float, invoice_count: int}>
     */
    private function buildChartSeries(int $userId, array $dateFilters, string $granularity): array
    {
        $invoiceQuery = FreightInvoice::query()
            ->where('user_id', $userId)
            ->select(['invoice_date', 'balance_amount']);

        ListFilter::applyDate($invoiceQuery, $dateFilters, 'invoice_date');

        $paymentQuery = InvoicePayment::query()
            ->where('user_id', $userId)
            ->select(['payment_date', 'amount']);

        ListFilter::applyDate($paymentQuery, $dateFilters, 'payment_date');

        $bucketFormat = $granularity === 'day' ? 'Y-m-d' : 'Y-m';
        $buckets = [];

        foreach ($invoiceQuery->get() as $invoice) {
            if (! $invoice->invoice_date) {
                continue;
            }

            $key = Carbon::parse($invoice->invoice_date)->format($bucketFormat);
            $this->ensureBucket($buckets, $key, $granularity);

            $buckets[$key]['balance_due'] += (float) $invoice->balance_amount;
            $buckets[$key]['invoice_count']++;
        }

        foreach ($paymentQuery->get() as $payment) {
            if (! $payment->payment_date) {
                continue;
            }

            $key = Carbon::parse($payment->payment_date)->format($bucketFormat);
            $this->ensureBucket($buckets, $key, $granularity);

            $buckets[$key]['received'] += (float) $payment->amount;
        }

        ksort($buckets);

        $series = array_values(array_map(function (array $row) {
            return [
                'key' => $row['key'],
                'label' => $row['label'],
                'balance_due' => round($row['balance_due'], 2),
                'received' => round($row['received'], 2),
                'invoice_count' => $row['invoice_count'],
            ];
        }, $buckets));

        if (($dateFilters['date_range'] ?? 'all') === 'all' && count($series) > self::CHART_PERIOD_LIMIT) {
            $series = array_slice($series, -self::CHART_PERIOD_LIMIT);
        }

        return $series;
    }

    /** @param  array<string, array{key: string, label: string, balance_due: float, received: float, invoice_count: int}>  $buckets */
    private function ensureBucket(array &$buckets, string $key, string $granularity): void
    {
        if (isset($buckets[$key])) {
            return;
        }

        $date = Carbon::createFromFormat($granularity === 'day' ? 'Y-m-d' : 'Y-m', $key);

        $buckets[$key] = [
            'key' => $key,
            'label' => $granularity === 'day' ? $date->format('d M') : $date->format('M Y'),
            'balance_due' => 0.0,
            'received' => 0.0,
            'invoice_count' => 0,
        ];
    }
}
