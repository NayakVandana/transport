<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Customer;
use App\Models\FreightInvoice;
use App\Models\RouteLocation;
use App\Models\User;
use App\Models\Vehicle;
use App\Support\AmountInWords;
use App\Support\EntryNumberGenerator;
use App\Support\FreightInvoiceCalculator;
use Illuminate\Database\Seeder;

class TransportSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::query()->first();
        if (! $user) {
            return;
        }

        $company = Company::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'name' => 'RELIABLE TRANS & LOGISTICS',
                'pan' => 'AEJPD7847P',
                'gst' => '24AEJPD7847P1ZX',
                'udyam_reg_no' => 'UDYAM-GJ-25-0003960',
                'udyam_date' => '2025-01-15',
                'jurisdiction' => 'SUBJECT TO VAPI JURISDICTION',
                'sac_code' => '996791',
                'entry_number_prefix' => 'R2526',
                'entry_next_sequence' => 1769,
                'igst_rate' => 5,
                'bank_account_name' => 'RELIABLE TRANS & LOGISTICS',
                'bank_account_no' => '1234567890',
                'bank_ifsc' => 'HDFC0001234',
                'bank_name' => 'HDFC BANK',
                'bank_branch' => 'VAPI',
            ],
        );

        $customer = Customer::query()->updateOrCreate(
            ['user_id' => $user->id, 'name' => 'A/C. VAISHNAVI TRANSPORT VP'],
            [
                'mobile' => '9821596969',
                'address' => "C-519, 5TH FLOOR, STEEL CHAMBER\nSTEEL MARKET, KALAMBOLI\nNAVI MUMBAI-410218\nMAHARASHTRA-27",
                'state_code' => '27',
            ],
        );

        Vehicle::query()->firstOrCreate(
            ['user_id' => $user->id, 'vehicle_number' => 'MH04JU9931'],
            ['status' => 'active'],
        );
        Vehicle::query()->firstOrCreate(
            ['user_id' => $user->id, 'vehicle_number' => 'MH04JU9932'],
            ['status' => 'active'],
        );

        RouteLocation::query()->firstOrCreate(
            ['user_id' => $user->id, 'name' => 'J N P T / SARIGAM / 1X20'],
        );

        $lines = [
            [
                'entry_number' => 'R2526-1767',
                'entry_date' => '2025-08-13',
                'vehicle_number' => 'MH04JU9931',
                'route_from' => 'J N P T / SARIGAM / 1X20',
                'product_name' => 'AS PER INVOICES',
                'weight' => 1,
                'rate' => 24000,
                'advance_paid' => 23800,
                'empty_container_charge' => 2386,
            ],
            [
                'entry_number' => 'R2526-1768',
                'entry_date' => '2025-08-14',
                'vehicle_number' => 'MH04JU9932',
                'route_from' => 'J N P T / SARIGAM / 1X20',
                'product_name' => 'AS PER INVOICES',
                'weight' => 1,
                'rate' => 24000,
                'advance_paid' => 23800,
                'empty_container_charge' => 0,
            ],
        ];

        [$totals, $lineFreights] = FreightInvoiceCalculator::forPersistence($lines, 5);

        $invoice = FreightInvoice::query()->updateOrCreate(
            ['bill_number' => 'R2526-0608'],
            [
                'user_id' => $user->id,
                'company_id' => $company->id,
                'customer_id' => $customer->id,
                'invoice_date' => '2025-09-08',
                'sac_code' => '996791',
                'status' => 'finalized',
                'igst_rate' => 5,
                ...$totals,
                'balance_in_words' => AmountInWords::rupees($totals['balance_amount']),
                'prepared_by' => 'Admin',
            ],
        );

        $invoice->lines()->delete();
        foreach ($lines as $i => $line) {
            $invoice->lines()->create([
                'serial_number' => $i + 1,
                ...$line,
                'freight' => $lineFreights[$i],
            ]);
        }

        EntryNumberGenerator::syncCompanySequence(
            $company->fresh(),
            collect($lines)->pluck('entry_number')->all(),
        );
    }
}
