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

            // Owner
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Business identity
            $table->string('name');
            $table->string('pan', 20)->nullable();
            $table->string('gst', 20)->nullable();
            $table->string('udyam_reg_no')->nullable();
            $table->date('udyam_date')->nullable();
            $table->string('jurisdiction')->nullable();
            $table->text('address')->nullable();

            // Tax & billing defaults
            $table->string('sac_code', 10)->default('996791');
            $table->decimal('igst_rate', 8, 4)->default(5);

            // Entry number auto-generation (e.g. R2526-1767)
            $table->string('entry_number_prefix', 20)->default('R2526');
            $table->unsignedInteger('entry_next_sequence')->default(1);

            // Bank details (printed on invoice)
            $table->string('bank_account_name')->nullable();
            $table->string('bank_account_no')->nullable();
            $table->string('bank_ifsc', 20)->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_branch')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
