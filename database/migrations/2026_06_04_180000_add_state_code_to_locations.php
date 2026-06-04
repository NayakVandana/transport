<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('locations', 'state_code')) {
            Schema::table('locations', function (Blueprint $table) {
                $table->string('state_code', 5)->default('24')->after('user_id');
            });
        }

        DB::table('locations')
            ->whereNull('state_code')
            ->orWhere('state_code', '')
            ->update(['state_code' => '24']);

        Schema::table('locations', function (Blueprint $table) {
            $table->index('user_id', 'locations_user_id_index');
        });

        Schema::table('locations', function (Blueprint $table) {
            $table->dropUnique('route_locations_user_id_name_unique');
            $table->unique(['user_id', 'state_code', 'name']);
        });
    }

    public function down(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'state_code', 'name']);
            $table->unique(['user_id', 'name'], 'route_locations_user_id_name_unique');
            $table->dropIndex('locations_user_id_index');
            $table->dropColumn('state_code');
        });
    }
};
