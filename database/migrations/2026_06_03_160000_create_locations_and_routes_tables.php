<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('route_locations') && ! Schema::hasTable('locations')) {
            Schema::rename('route_locations', 'locations');
        }

        if (! Schema::hasTable('locations')) {
            Schema::create('locations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('name');
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->unique(['user_id', 'name']);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('locations') && ! Schema::hasTable('route_locations')) {
            Schema::rename('locations', 'route_locations');
        }
    }
};
