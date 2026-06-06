<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loading_slips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('party_id')->nullable()->constrained()->nullOnDelete();
            $table->date('slip_date');
            $table->date('loading_date')->nullable();
            $table->string('route_from')->nullable();
            $table->string('route_to')->nullable();
            $table->string('authorized_signatory')->nullable();
            $table->foreignId('freight_invoice_id')->nullable()->constrained('freight_invoices')->nullOnDelete();
            $table->string('status', 20)->default('draft');
            $table->decimal('total_freight', 14, 2)->default(0);
            $table->decimal('total_advance', 14, 2)->default(0);
            $table->decimal('total_balance', 14, 2)->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'slip_date']);
        });

        Schema::create('loading_slip_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loading_slip_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('serial_number');
            $table->foreignId('vehicle_id')->nullable()->constrained()->nullOnDelete();
            $table->string('vehicle_number', 20)->nullable();
            $table->string('destination')->nullable();
            $table->decimal('freight_rate', 14, 2)->default(0);
            $table->decimal('advance', 14, 2)->default(0);
            $table->decimal('balance', 14, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loading_slip_lines');
        Schema::dropIfExists('loading_slips');
    }
};
