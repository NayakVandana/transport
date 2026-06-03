<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_reports', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('serial_number');
            $table->date('report_date');
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->text('description')->nullable();
            $table->foreignId('current_party_id')->nullable()->constrained('parties')->nullOnDelete();
            $table->foreignId('planning_party_id')->nullable()->constrained('parties')->nullOnDelete();
            $table->string('location')->nullable();
            $table->decimal('detention', 14, 2)->default(0);
            $table->unsignedSmallInteger('day')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['user_id', 'report_date', 'vehicle_id'], 'daily_reports_user_date_vehicle_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_reports');
    }
};
