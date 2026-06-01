<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entrybooks', function (Blueprint $table) {
            $table->foreignId('party_id')
                ->after('vehicle_id')
                ->constrained()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('entrybooks', function (Blueprint $table) {
            $table->dropConstrainedForeignId('party_id');
        });
    }
};
