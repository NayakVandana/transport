<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('parties', function (Blueprint $table) {
            $table->string('party_owner_name')->nullable()->after('name');
            $table->string('logo_path')->nullable()->after('party_owner_name');
            $table->string('email')->nullable()->after('logo_path');
            $table->string('pan_no', 20)->nullable()->after('email');
            $table->string('gst_no', 20)->nullable()->after('pan_no');
            $table->string('international_tax_id', 50)->nullable()->after('gst_no');
            $table->json('mobiles')->nullable()->after('mobile');
            $table->text('full_address')->nullable()->after('address');
            $table->string('city')->nullable()->after('full_address');
            $table->string('taluka')->nullable()->after('city');
            $table->string('district')->nullable()->after('taluka');
            $table->string('pincode', 10)->nullable()->after('district');
            $table->string('country')->nullable()->default('India')->after('state_code');
        });

        DB::table('parties')->orderBy('id')->chunkById(100, function ($parties) {
            foreach ($parties as $party) {
                $mobiles = $party->mobile ? json_encode([(string) $party->mobile]) : null;

                DB::table('parties')->where('id', $party->id)->update([
                    'mobiles' => $mobiles,
                    'full_address' => $party->address,
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('parties', function (Blueprint $table) {
            $table->dropColumn([
                'party_owner_name',
                'logo_path',
                'email',
                'pan_no',
                'gst_no',
                'international_tax_id',
                'mobiles',
                'full_address',
                'city',
                'taluka',
                'district',
                'pincode',
                'country',
            ]);
        });
    }
};
