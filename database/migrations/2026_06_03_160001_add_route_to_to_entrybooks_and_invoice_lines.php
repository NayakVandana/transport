<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entrybooks', function (Blueprint $table) {
            if (! Schema::hasColumn('entrybooks', 'route_to')) {
                $table->string('route_to')->nullable()->after('route_from');
            }
        });

        Schema::table('freight_invoice_lines', function (Blueprint $table) {
            if (! Schema::hasColumn('freight_invoice_lines', 'route_to')) {
                $table->string('route_to')->nullable()->after('route_from');
            }
        });
    }

    public function down(): void
    {
        Schema::table('entrybooks', function (Blueprint $table) {
            if (Schema::hasColumn('entrybooks', 'route_to')) {
                $table->dropColumn('route_to');
            }
        });

        Schema::table('freight_invoice_lines', function (Blueprint $table) {
            if (Schema::hasColumn('freight_invoice_lines', 'route_to')) {
                $table->dropColumn('route_to');
            }
        });
    }
};
