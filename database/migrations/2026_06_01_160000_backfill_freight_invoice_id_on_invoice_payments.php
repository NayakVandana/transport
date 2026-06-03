<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('invoice_payments')
            ->join('freight_invoices', function ($join) {
                $join->on('freight_invoices.user_id', '=', 'invoice_payments.user_id')
                    ->whereColumn('freight_invoices.bill_number', 'invoice_payments.bill_number');
            })
            ->whereNull('invoice_payments.freight_invoice_id')
            ->whereNotNull('invoice_payments.bill_number')
            ->update([
                'invoice_payments.freight_invoice_id' => DB::raw('freight_invoices.id'),
            ]);
    }

    public function down(): void
    {
        // Non-destructive backfill; nothing to revert.
    }
};
