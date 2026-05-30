<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entrybooks', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('entry_number', 50);
            $table->date('entry_date');
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->string('route_from')->nullable();

            $table->decimal('freight', 14, 2)->default(0);
            $table->decimal('advance', 14, 2)->default(0);
            $table->decimal('balance', 14, 2)->default(0);

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['user_id', 'entry_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entrybooks');
    }
};
