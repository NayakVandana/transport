<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('parties', function (Blueprint $table) {
            $table->renameColumn('logo_path', 'photo_path');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('logo_path', 'photo_path');
        });
    }

    public function down(): void
    {
        Schema::table('parties', function (Blueprint $table) {
            $table->renameColumn('photo_path', 'logo_path');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('photo_path', 'logo_path');
        });
    }
};
