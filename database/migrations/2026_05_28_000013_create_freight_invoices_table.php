<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('freight_invoices', function (Blueprint $table) {
            $table->id();

            // Relations
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();

            // Invoice header
            $table->string('bill_number')->unique();
            $table->date('invoice_date');
            $table->string('sac_code', 10)->default('996791');
            $table->string('status', 20)->default('draft'); // draft | finalized

            // Line totals (calculated on save)
            $table->decimal('total_weight', 12, 3)->default(0);
            $table->decimal('total_freight', 14, 2)->default(0);
            $table->decimal('total_empty_container_charge', 14, 2)->default(0);
            $table->decimal('net_value', 14, 2)->default(0);
            $table->decimal('total_advance', 14, 2)->default(0);
            $table->decimal('balance_amount', 14, 2)->default(0);
            $table->decimal('gross_freight', 14, 2)->default(0);

            // GST
            $table->decimal('igst_rate', 8, 4)->default(5);
            $table->decimal('igst_amount', 14, 2)->default(0);

            // Footer
            $table->string('balance_in_words')->nullable();
            $table->string('prepared_by')->nullable();
            $table->string('checked_by')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('freight_invoices');
    }
};
