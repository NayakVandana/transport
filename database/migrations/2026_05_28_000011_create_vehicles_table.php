<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();

            // Owner
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->index('user_id');

            // Vehicle identity
            $table->string('vehicle_number', 20);
            $table->string('vehicle_type')->nullable();
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->string('capacity', 50)->nullable();
            $table->string('fuel_type', 30)->nullable();

            // Insurance
            $table->string('insurance_number', 50)->nullable();
            $table->date('insurance_expiry')->nullable();

            // Permits & compliance
            $table->string('permit_number', 50)->nullable();
            $table->date('permit_expiry')->nullable();
            $table->date('pollution_expiry')->nullable();
            $table->date('fitness_expiry')->nullable();

            // active | inactive
            $table->string('status', 20)->default('active');

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['user_id', 'vehicle_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
