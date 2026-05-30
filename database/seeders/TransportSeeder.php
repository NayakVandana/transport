<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Driver;
use App\Models\DriverDocument;
use App\Models\Entrybook;
use App\Models\FreightInvoice;
use App\Models\RouteLocation;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\VehicleDocument;
use App\Support\AmountInWords;
use App\Support\BookingCalculator;
use App\Support\EntryNumberGenerator;
use App\Support\FreightInvoiceCalculator;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class TransportSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::query()->first();
        if (! $user) {
            return;
        }

        $userId = (int) $user->id;

        $company = $this->seedCompany($userId);
        $customers = $this->seedCustomers($userId);
        $vehicles = $this->seedVehicles($userId);
        $drivers = $this->seedDrivers($userId);
        $routes = $this->seedRoutes($userId);
        $invoice = $this->seedInvoice($userId, $company, $customers[0], $vehicles);
        $this->seedBookings($userId, $vehicles, $drivers);
        $this->seedEntrybooks($userId, $vehicles);
        $this->seedVehicleDocuments($userId, $vehicles);
        $this->seedDriverDocuments($userId, $drivers);
    }

    private function seedCompany(int $userId): Company
    {
        return Company::query()->updateOrCreate(
            ['user_id' => $userId],
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
                'address' => "Plot 12, GIDC, Vapi\nGujarat - 396195",
            ],
        );
    }

    /** @return list<Customer> */
    private function seedCustomers(int $userId): array
    {
        $customers = [
            [
                'name' => 'A/C. VAISHNAVI TRANSPORT VP',
                'mobile' => '9821596969',
                'address' => "C-519, 5TH FLOOR, STEEL CHAMBER\nSTEEL MARKET, KALAMBOLI\nNAVI MUMBAI-410218\nMAHARASHTRA-27",
                'state_code' => '27',
            ],
            [
                'name' => 'SHREE LOGISTICS PVT LTD',
                'mobile' => '9876543210',
                'address' => "Office 204, Trade Centre\nVapi Silvassa Road\nGujarat - 396191",
                'state_code' => '24',
            ],
        ];

        return array_map(
            fn (array $data) => Customer::query()->updateOrCreate(
                ['user_id' => $userId, 'name' => $data['name']],
                $data,
            ),
            $customers,
        );
    }

    /** @return array<string, Vehicle> */
    private function seedVehicles(int $userId): array
    {
        $vehicles = [
            'MH04JU9931' => [
                'vehicle_type' => 'Container Truck',
                'brand' => 'Tata',
                'model' => 'LPT 4225',
                'capacity' => '20T',
                'fuel_type' => 'Diesel',
                'insurance_number' => 'INS-MH04-2026-001',
                'insurance_expiry' => '2026-08-31',
                'permit_number' => 'GJ-PR-8821',
                'permit_expiry' => '2026-06-30',
                'pollution_expiry' => '2026-05-15',
                'fitness_expiry' => '2026-07-20',
                'status' => 'active',
            ],
            'MH04JU9932' => [
                'vehicle_type' => 'Container Truck',
                'brand' => 'Ashok Leyland',
                'model' => 'U-4923',
                'capacity' => '20T',
                'fuel_type' => 'Diesel',
                'insurance_number' => 'INS-MH04-2026-002',
                'insurance_expiry' => '2026-09-15',
                'permit_number' => 'GJ-PR-8822',
                'permit_expiry' => '2026-08-10',
                'pollution_expiry' => '2026-06-01',
                'fitness_expiry' => '2026-08-05',
                'status' => 'active',
            ],
            'GJ18BT4521' => [
                'vehicle_type' => 'Trailer',
                'brand' => 'Mahindra',
                'model' => 'Blazo X',
                'capacity' => '35T',
                'fuel_type' => 'Diesel',
                'insurance_number' => 'INS-GJ18-2026-003',
                'insurance_expiry' => '2026-10-01',
                'permit_number' => 'GJ-PR-9901',
                'permit_expiry' => '2026-09-30',
                'pollution_expiry' => '2026-07-01',
                'fitness_expiry' => '2026-09-15',
                'status' => 'inactive',
            ],
        ];

        $result = [];
        foreach ($vehicles as $number => $data) {
            $result[$number] = Vehicle::query()->updateOrCreate(
                ['user_id' => $userId, 'vehicle_number' => $number],
                $data,
            );
        }

        return $result;
    }

    /** @return array<string, Driver> */
    private function seedDrivers(int $userId): array
    {
        $drivers = [
            'rajesh-patel' => [
                'name' => 'Rajesh Patel',
                'mobile' => '9898012345',
                'license_number' => 'GJ-12-20180012345',
                'license_expiry' => '2028-03-15',
                'joining_date' => '2022-04-01',
                'salary' => 18000,
                'address' => 'Vapi, Gujarat',
                'status' => 'active',
            ],
            'suresh-sharma' => [
                'name' => 'Suresh Sharma',
                'mobile' => '9898065432',
                'license_number' => 'MH-14-20190054321',
                'license_expiry' => '2027-11-20',
                'joining_date' => '2023-01-10',
                'salary' => 16500,
                'address' => 'Navsari, Gujarat',
                'status' => 'active',
            ],
        ];

        $result = [];
        foreach ($drivers as $key => $data) {
            $result[$key] = Driver::query()->updateOrCreate(
                ['user_id' => $userId, 'license_number' => $data['license_number']],
                $data,
            );
        }

        return $result;
    }

    /** @return list<RouteLocation> */
    private function seedRoutes(int $userId): array
    {
        $names = [
            'J N P T / SARIGAM / 1X20',
            'NHAVA SHEVA / VAPI',
            'MUNDRA / HAZIRA',
        ];

        return array_map(
            fn (string $name) => RouteLocation::query()->firstOrCreate(
                ['user_id' => $userId, 'name' => $name],
            ),
            $names,
        );
    }

    /** @param  array<string, Vehicle>  $vehicles */
    private function seedInvoice(int $userId, Company $company, Customer $customer, array $vehicles): FreightInvoice
    {
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
                'user_id' => $userId,
                'company_id' => $company->id,
                'customer_id' => $customer->id,
                'invoice_date' => '2025-09-08',
                'sac_code' => '996791',
                'status' => 'finalized',
                'igst_rate' => 5,
                ...$totals,
                'balance_in_words' => AmountInWords::rupees($totals['balance_amount']),
                'prepared_by' => 'Admin',
                'checked_by' => 'Manager',
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

        return $invoice;
    }

    /**
     * @param  array<string, Vehicle>  $vehicles
     * @param  array<string, Driver>  $drivers
     * @return list<Booking>
     */
    private function seedBookings(int $userId, array $vehicles, array $drivers): array
    {
        $rows = [
            [
                'key' => 'booking-aug-13',
                'booking_date' => '2025-08-13',
                'vehicle_number' => 'MH04JU9931',
                'driver_key' => 'rajesh-patel',
                'freight' => 24000,
                'advance' => 12000,
                'empty_charge' => 2386,
                'maintenance' => 500,
            ],
            [
                'key' => 'booking-aug-14',
                'booking_date' => '2025-08-14',
                'vehicle_number' => 'MH04JU9932',
                'driver_key' => 'suresh-sharma',
                'freight' => 24000,
                'advance' => 15000,
                'empty_charge' => 0,
                'maintenance' => 0,
            ],
            [
                'key' => 'booking-aug-20',
                'booking_date' => '2025-08-20',
                'vehicle_number' => 'MH04JU9931',
                'driver_key' => 'rajesh-patel',
                'freight' => 18500,
                'advance' => 10000,
                'empty_charge' => 1200,
                'maintenance' => 300,
            ],
        ];

        $bookings = [];
        foreach ($rows as $row) {
            $balance = BookingCalculator::balance(
                $row['freight'],
                $row['advance'],
                $row['empty_charge'],
                $row['maintenance'],
            );

            $booking = Booking::query()->updateOrCreate(
                [
                    'user_id' => $userId,
                    'booking_date' => $row['booking_date'],
                    'vehicle_id' => $vehicles[$row['vehicle_number']]->id,
                ],
                [
                    'driver_id' => $drivers[$row['driver_key']]->id,
                    'freight' => $row['freight'],
                    'advance' => $row['advance'],
                    'empty_charge' => $row['empty_charge'],
                    'maintenance' => $row['maintenance'],
                    'balance' => $balance,
                ],
            );

            $bookings[$row['key']] = $booking;
        }

        return $bookings;
    }

    /** @param  array<string, Vehicle>  $vehicles */
    private function seedEntrybooks(int $userId, array $vehicles): void
    {
        $entries = [
            [
                'entry_number' => '001',
                'entry_date' => '2025-08-13',
                'vehicle_number' => 'MH04JU9931',
                'route_from' => 'J N P T / SARIGAM / 1X20',
                'freight' => 24000,
                'advance' => 12000,
            ],
            [
                'entry_number' => '002',
                'entry_date' => '2025-08-14',
                'vehicle_number' => 'MH04JU9932',
                'route_from' => 'J N P T / SARIGAM / 1X20',
                'freight' => 24000,
                'advance' => 15000,
            ],
            [
                'entry_number' => '003',
                'entry_date' => '2025-08-20',
                'vehicle_number' => 'MH04JU9931',
                'route_from' => 'NHAVA SHEVA / VAPI',
                'freight' => 18500,
                'advance' => 10000,
            ],
        ];

        foreach ($entries as $row) {
            $freight = (float) $row['freight'];
            $advance = (float) $row['advance'];

            Entrybook::query()->updateOrCreate(
                [
                    'user_id' => $userId,
                    'entry_number' => $row['entry_number'],
                ],
                [
                    'entry_date' => $row['entry_date'],
                    'vehicle_id' => $vehicles[$row['vehicle_number']]->id,
                    'route_from' => $row['route_from'],
                    'freight' => $freight,
                    'advance' => $advance,
                    'balance' => round($freight - $advance, 2),
                ],
            );
        }
    }

    /** @param  array<string, Vehicle>  $vehicles */
    private function seedVehicleDocuments(int $userId, array $vehicles): void
    {
        $vehicle = $vehicles['MH04JU9931'];

        $documents = [
            [
                'document_type' => 'insurance',
                'title' => 'Insurance policy 2026',
                'filename' => 'insurance-policy.pdf',
                'expiry_date' => '2026-08-31',
                'notes' => 'Comprehensive cover',
            ],
            [
                'document_type' => 'permit',
                'title' => 'National permit',
                'filename' => 'national-permit.pdf',
                'expiry_date' => '2026-06-30',
                'notes' => null,
            ],
            [
                'document_type' => 'fitness',
                'title' => 'Fitness certificate',
                'filename' => 'fitness-cert.pdf',
                'expiry_date' => '2026-07-20',
                'notes' => null,
            ],
        ];

        foreach ($documents as $doc) {
            $filePath = $this->seedDocumentFile(
                "vehicles/{$userId}/{$vehicle->id}",
                $doc['filename'],
            );

            VehicleDocument::query()->updateOrCreate(
                [
                    'vehicle_id' => $vehicle->id,
                    'document_type' => $doc['document_type'],
                    'title' => $doc['title'],
                ],
                [
                    'user_id' => $userId,
                    'file_path' => $filePath,
                    'expiry_date' => $doc['expiry_date'],
                    'notes' => $doc['notes'],
                ],
            );
        }
    }

    /** @param  array<string, Driver>  $drivers */
    private function seedDriverDocuments(int $userId, array $drivers): void
    {
        $driver = $drivers['rajesh-patel'];

        $documents = [
            [
                'document_type' => 'license',
                'title' => 'Driving license',
                'filename' => 'driving-license.pdf',
                'expiry_date' => '2028-03-15',
                'notes' => null,
            ],
            [
                'document_type' => 'aadhaar',
                'title' => 'Aadhaar card',
                'filename' => 'aadhaar.pdf',
                'expiry_date' => null,
                'notes' => null,
            ],
        ];

        foreach ($documents as $doc) {
            $filePath = $this->seedDocumentFile(
                "drivers/{$userId}/{$driver->id}",
                $doc['filename'],
            );

            DriverDocument::query()->updateOrCreate(
                [
                    'driver_id' => $driver->id,
                    'document_type' => $doc['document_type'],
                    'title' => $doc['title'],
                ],
                [
                    'user_id' => $userId,
                    'file_path' => $filePath,
                    'expiry_date' => $doc['expiry_date'],
                    'notes' => $doc['notes'],
                ],
            );
        }
    }

    private function seedDocumentFile(string $folder, string $filename): string
    {
        $path = "{$folder}/{$filename}";

        if (! Storage::disk('public')->exists($path)) {
            Storage::disk('public')->put($path, $this->minimalPdfContents($filename));
        }

        return $path;
    }

    private function minimalPdfContents(string $label): string
    {
        $text = "Sample document: {$label}";

        return "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
            ."2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
            ."3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 144]>>endobj\n"
            ."4 0 obj<</Length ".strlen($text).">>stream\n{$text}\nendstream endobj\n"
            ."trailer<</Root 1 0 R>>\n%%EOF";
    }
}
