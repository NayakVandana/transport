<?php

namespace Database\Seeders;

use App\Models\AddressLocality;
use Illuminate\Database\Seeder;

class AddressLocalitySeeder extends Seeder
{
    public function run(): void
    {
        AddressLocality::query()->delete();

        foreach (config('address_localities', []) as $stateIndex => $state) {
            $stateRow = AddressLocality::query()->create([
                'parent_id' => null,
                'level' => 'state',
                'name' => $state['name'],
                'state_code' => $state['state_code'],
                'sort_order' => $state['sort_order'] ?? ($stateIndex + 1),
            ]);

            foreach ($state['districts'] ?? [] as $districtIndex => $district) {
                $districtRow = AddressLocality::query()->create([
                    'parent_id' => $stateRow->id,
                    'level' => 'district',
                    'name' => $district['name'],
                    'state_code' => $state['state_code'],
                    'sort_order' => $districtIndex + 1,
                ]);

                foreach ($district['talukas'] ?? [] as $talukaIndex => $taluka) {
                    $talukaRow = AddressLocality::query()->create([
                        'parent_id' => $districtRow->id,
                        'level' => 'taluka',
                        'name' => $taluka['name'],
                        'state_code' => $state['state_code'],
                        'sort_order' => $talukaIndex + 1,
                    ]);

                    foreach ($taluka['cities'] ?? [] as $cityIndex => $city) {
                        $cityRow = AddressLocality::query()->create([
                            'parent_id' => $talukaRow->id,
                            'level' => 'city',
                            'name' => $city['name'],
                            'state_code' => $state['state_code'],
                            'sort_order' => $cityIndex + 1,
                        ]);

                        foreach ($city['pincodes'] ?? [] as $pincodeIndex => $pincode) {
                            AddressLocality::query()->create([
                                'parent_id' => $cityRow->id,
                                'level' => 'pincode',
                                'name' => (string) $pincode,
                                'state_code' => $state['state_code'],
                                'pincode' => (string) $pincode,
                                'sort_order' => $pincodeIndex + 1,
                            ]);
                        }
                    }
                }
            }
        }
    }
}
