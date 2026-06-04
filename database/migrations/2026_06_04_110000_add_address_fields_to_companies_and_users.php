<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->text('full_address')->nullable()->after('address');
            $table->string('city')->nullable()->after('full_address');
            $table->string('taluka')->nullable()->after('city');
            $table->string('district')->nullable()->after('taluka');
            $table->string('pincode', 10)->nullable()->after('district');
            $table->string('state_code', 5)->nullable()->after('pincode');
            $table->string('country')->nullable()->default('India')->after('state_code');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->text('full_address')->nullable()->after('email');
            $table->string('city')->nullable()->after('full_address');
            $table->string('taluka')->nullable()->after('city');
            $table->string('district')->nullable()->after('taluka');
            $table->string('pincode', 10)->nullable()->after('district');
            $table->string('state_code', 5)->nullable()->after('pincode');
            $table->string('country')->nullable()->default('India')->after('state_code');
            $table->text('address')->nullable()->after('country');
        });

        DB::table('companies')->orderBy('id')->chunkById(100, function ($companies) {
            foreach ($companies as $company) {
                DB::table('companies')->where('id', $company->id)->update([
                    'full_address' => $company->address,
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'full_address',
                'city',
                'taluka',
                'district',
                'pincode',
                'state_code',
                'country',
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'full_address',
                'city',
                'taluka',
                'district',
                'pincode',
                'state_code',
                'country',
                'address',
            ]);
        });
    }
};
