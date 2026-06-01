<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $nullPartyIds = DB::table('entrybooks')->whereNull('party_id')->pluck('id');

        if ($nullPartyIds->isNotEmpty()) {
            foreach ($nullPartyIds as $entrybookId) {
                $userId = DB::table('entrybooks')->where('id', $entrybookId)->value('user_id');
                $partyId = DB::table('parties')
                    ->where('user_id', $userId)
                    ->orderBy('id')
                    ->value('id');

                if ($partyId) {
                    DB::table('entrybooks')->where('id', $entrybookId)->update(['party_id' => $partyId]);
                }
            }
        }

        Schema::table('entrybooks', function (Blueprint $table) {
            $table->dropForeign(['party_id']);
        });

        Schema::table('entrybooks', function (Blueprint $table) {
            $table->foreignId('party_id')->nullable(false)->change();
            $table->foreign('party_id')->references('id')->on('parties')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('entrybooks', function (Blueprint $table) {
            $table->dropForeign(['party_id']);
        });

        Schema::table('entrybooks', function (Blueprint $table) {
            $table->foreignId('party_id')->nullable()->change();
            $table->foreign('party_id')->references('id')->on('parties')->nullOnDelete();
        });
    }
};
