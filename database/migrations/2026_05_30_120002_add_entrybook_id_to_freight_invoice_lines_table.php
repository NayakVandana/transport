<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('freight_invoice_lines', function (Blueprint $table) {
            $table->foreignId('entrybook_id')
                ->nullable()
                ->after('freight_invoice_id')
                ->constrained()
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('freight_invoice_lines', function (Blueprint $table) {
            $table->dropConstrainedForeignId('entrybook_id');
        });
    }
};
