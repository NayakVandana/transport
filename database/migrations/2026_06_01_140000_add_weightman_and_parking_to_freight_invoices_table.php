<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('freight_invoice_lines', function (Blueprint $table) {
            $table->decimal('weightman', 14, 2)->default(0)->after('detention');
            $table->decimal('parking', 14, 2)->default(0)->after('weightman');
        });

        Schema::table('freight_invoices', function (Blueprint $table) {
            $table->decimal('total_weightman', 14, 2)->default(0)->after('total_detention');
            $table->decimal('total_parking', 14, 2)->default(0)->after('total_weightman');
        });
    }

    public function down(): void
    {
        Schema::table('freight_invoice_lines', function (Blueprint $table) {
            $table->dropColumn(['weightman', 'parking']);
        });

        Schema::table('freight_invoices', function (Blueprint $table) {
            $table->dropColumn(['total_weightman', 'total_parking']);
        });
    }
};
