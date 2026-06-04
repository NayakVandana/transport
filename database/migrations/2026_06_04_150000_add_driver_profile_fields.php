<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->string('photo_path')->nullable()->after('name');
            $table->string('email')->nullable()->after('photo_path');
            $table->string('aadhaar_no', 12)->nullable()->after('email');
            $table->string('pan_no', 20)->nullable()->after('aadhaar_no');
            $table->json('mobiles')->nullable()->after('mobile');
        });

        DB::table('drivers')->orderBy('id')->chunkById(100, function ($drivers) {
            foreach ($drivers as $driver) {
                $mobiles = $driver->mobile ? json_encode([(string) $driver->mobile]) : null;

                DB::table('drivers')->where('id', $driver->id)->update([
                    'mobiles' => $mobiles,
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropColumn([
                'photo_path',
                'email',
                'aadhaar_no',
                'pan_no',
                'mobiles',
            ]);
        });
    }
};
