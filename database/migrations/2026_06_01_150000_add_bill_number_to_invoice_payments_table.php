<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoice_payments', function (Blueprint $table) {
            $table->string('bill_number', 50)->nullable()->after('freight_invoice_id');
        });

        DB::table('invoice_payments')
            ->join('freight_invoices', 'freight_invoices.id', '=', 'invoice_payments.freight_invoice_id')
            ->whereNull('invoice_payments.bill_number')
            ->update([
                'invoice_payments.bill_number' => DB::raw('freight_invoices.bill_number'),
            ]);
    }

    public function down(): void
    {
        Schema::table('invoice_payments', function (Blueprint $table) {
            $table->dropColumn('bill_number');
        });
    }
};
