<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('address_localities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('address_localities')->cascadeOnDelete();
            $table->string('level', 20);
            $table->string('name');
            $table->string('state_code', 5)->nullable();
            $table->string('pincode', 10)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['level', 'state_code']);
            $table->index(['parent_id', 'level']);
            $table->unique(['parent_id', 'level', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('address_localities');
    }
};
