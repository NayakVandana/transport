<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();

            // Owner
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Booking details
            $table->date('booking_date');
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();

            // Amounts
            $table->decimal('freight', 14, 2)->default(0);
            $table->decimal('advance', 14, 2)->default(0);
            $table->decimal('empty_charge', 14, 2)->default(0);
            $table->decimal('maintenance', 14, 2)->default(0);
            $table->decimal('balance', 14, 2)->default(0);

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
