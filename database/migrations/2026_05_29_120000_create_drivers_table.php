<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drivers', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->index('user_id');

            $table->string('name');
            $table->string('mobile', 15)->nullable();
            $table->string('license_number', 50)->nullable();
            $table->date('license_expiry')->nullable();
            $table->date('joining_date')->nullable();
            $table->decimal('salary', 14, 2)->nullable();
            $table->text('address')->nullable();
            $table->string('status', 20)->default('active');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drivers');
    }
};
