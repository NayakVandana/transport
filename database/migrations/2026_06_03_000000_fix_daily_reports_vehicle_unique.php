<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('daily_reports', function (Blueprint $table) {
            $table->unique(['user_id', 'report_date', 'vehicle_id'], 'daily_reports_user_date_vehicle_unique');
        });

        Schema::table('daily_reports', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'report_date', 'serial_number']);
        });
    }

    public function down(): void
    {
        Schema::table('daily_reports', function (Blueprint $table) {
            $table->unique(['user_id', 'report_date', 'serial_number']);
        });

        Schema::table('daily_reports', function (Blueprint $table) {
            $table->dropUnique('daily_reports_user_date_vehicle_unique');
        });
    }
};
