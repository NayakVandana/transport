<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->boolean('show_photo')->default(true)->after('photo_path');
            $table->boolean('show_email')->default(true)->after('email');
            $table->boolean('show_address')->default(true)->after('country');
        });
    }

    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropColumn(['show_photo', 'show_email', 'show_address']);
        });
    }
};
