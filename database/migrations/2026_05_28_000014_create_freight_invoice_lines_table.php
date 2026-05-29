<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('freight_invoice_lines', function (Blueprint $table) {
            $table->id();

            // Parent invoice
            $table->foreignId('freight_invoice_id')->constrained()->cascadeOnDelete();

            // Line order
            $table->unsignedSmallInteger('serial_number');

            // Entry details
            $table->string('entry_number')->nullable();
            $table->date('entry_date')->nullable();
            $table->string('vehicle_number', 20)->nullable();
            $table->string('route_from')->nullable();
            $table->string('product_name')->nullable();

            // Amounts
            $table->decimal('weight', 12, 3)->default(1);
            $table->decimal('rate', 14, 2)->default(0);
            $table->decimal('freight', 14, 2)->default(0);
            $table->decimal('advance_paid', 14, 2)->default(0);
            $table->decimal('empty_container_charge', 14, 2)->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('freight_invoice_lines');
    }
};
