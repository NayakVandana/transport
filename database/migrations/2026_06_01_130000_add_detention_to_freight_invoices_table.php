<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('freight_invoice_lines', function (Blueprint $table) {
            $table->decimal('detention', 14, 2)->default(0)->after('empty_container_charge');
        });

        Schema::table('freight_invoices', function (Blueprint $table) {
            $table->decimal('total_detention', 14, 2)->default(0)->after('total_empty_container_charge');
        });
    }

    public function down(): void
    {
        Schema::table('freight_invoice_lines', function (Blueprint $table) {
            $table->dropColumn('detention');
        });

        Schema::table('freight_invoices', function (Blueprint $table) {
            $table->dropColumn('total_detention');
        });
    }
};
