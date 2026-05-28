<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->string('entry_number_prefix', 20)->default('R2526')->after('sac_code');
            $table->unsignedInteger('entry_next_sequence')->default(1)->after('entry_number_prefix');
        });

        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('number', 20);
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['user_id', 'number']);
        });

        Schema::create('route_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['user_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('route_locations');
        Schema::dropIfExists('vehicles');

        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['entry_number_prefix', 'entry_next_sequence']);
        });
    }
};
