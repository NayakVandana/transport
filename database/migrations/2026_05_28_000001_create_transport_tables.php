<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('pan', 20)->nullable();
            $table->string('gst', 20)->nullable();
            $table->string('udyam_reg_no')->nullable();
            $table->date('udyam_date')->nullable();
            $table->string('jurisdiction')->nullable();
            $table->string('sac_code', 10)->default('996791');
            $table->decimal('igst_rate', 8, 4)->default(5);
            $table->string('bank_account_name')->nullable();
            $table->string('bank_account_no')->nullable();
            $table->string('bank_ifsc', 20)->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_branch')->nullable();
            $table->text('address')->nullable();
            $table->timestamps();
        });

        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('mobile', 15)->nullable();
            $table->text('address')->nullable();
            $table->string('state_code', 5)->nullable();
            $table->timestamps();
        });

        Schema::create('freight_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('bill_number')->unique();
            $table->date('invoice_date');
            $table->string('sac_code', 10)->default('996791');
            $table->string('status', 20)->default('draft');
            $table->decimal('total_weight', 12, 3)->default(0);
            $table->decimal('total_freight', 14, 2)->default(0);
            $table->decimal('total_empty_container_charge', 14, 2)->default(0);
            $table->decimal('net_value', 14, 2)->default(0);
            $table->decimal('total_advance', 14, 2)->default(0);
            $table->decimal('balance_amount', 14, 2)->default(0);
            $table->decimal('gross_freight', 14, 2)->default(0);
            $table->decimal('igst_rate', 8, 4)->default(5);
            $table->decimal('igst_amount', 14, 2)->default(0);
            $table->string('balance_in_words')->nullable();
            $table->string('prepared_by')->nullable();
            $table->string('checked_by')->nullable();
            $table->timestamps();
        });

        Schema::create('freight_invoice_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('freight_invoice_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('serial_number');
            $table->string('entry_number')->nullable();
            $table->date('entry_date')->nullable();
            $table->string('vehicle_number', 20)->nullable();
            $table->string('route_from')->nullable();
            $table->string('product_name')->nullable();
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
        Schema::dropIfExists('freight_invoices');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('companies');
    }
};
