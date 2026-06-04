<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['parties', 'companies', 'users'] as $table) {
            DB::table($table)
                ->whereNull('country')
                ->orWhere('country', '')
                ->update(['country' => 'India']);
        }
    }

    public function down(): void
    {
        // No rollback — default country is intentional.
    }
};
