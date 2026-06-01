<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Party;
use App\Models\Driver;
use App\Models\DriverDocument;
use App\Models\Entrybook;
use App\Models\FreightInvoice;
use App\Models\InvoicePayment;
use App\Models\RouteLocation;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\VehicleDocument;
use App\Models\VehicleExpense;
use App\Support\AmountInWords;
use App\Support\EntryNumberGenerator;
use App\Support\FreightInvoiceCalculator;
use App\Support\VehicleExpenseCalculator;
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
        $parties = $this->seedParties($userId);
        $vehicles = $this->seedVehicles($userId);
        $drivers = $this->seedDrivers($userId);
        $this->seedRoutes($userId);
        $entrybooks = $this->seedEntrybooks($userId, $vehicles, $parties);
        $this->seedInvoices($userId, $company, $parties, $vehicles, $entrybooks);
        $this->seedInvoicePayments($userId);
        $this->seedVehicleExpenses($userId, $vehicles);
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

    /** @return list<Party> */
    private function seedParties(int $userId): array
    {
        $parties = [
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
            fn (array $data) => Party::query()->updateOrCreate(
                ['user_id' => $userId, 'name' => $data['name']],
                $data,
            ),
            $parties,
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
            'amit-desai' => [
                'name' => 'Amit Desai',
                'mobile' => '9898078912',
                'license_number' => 'GJ-05-20200098765',
                'license_expiry' => '2029-01-10',
                'joining_date' => '2024-06-01',
                'salary' => 15000,
                'address' => 'Valsad, Gujarat',
                'status' => 'inactive',
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
            'PIPAVAV / RAJKOT',
        ];

        return array_map(
            fn (string $name) => RouteLocation::query()->updateOrCreate(
                ['user_id' => $userId, 'name' => $name],
                ['is_active' => true],
            ),
            $names,
        );
    }

    /**
     * @param  list<Party>  $parties
     * @param  array<string, Vehicle>  $vehicles
     * @param  array<string, Entrybook>  $entrybooks
     */
    private function seedInvoices(
        int $userId,
        Company $company,
        array $parties,
        array $vehicles,
        array $entrybooks,
    ): void {
        $invoices = [
            [
                'bill_number' => 'R2526-0608',
                'party_index' => 0,
                'invoice_date' => '2025-09-08',
                'status' => 'finalized',
                'prepared_by' => 'Admin',
                'checked_by' => 'Manager',
                'lines' => [
                    [
                        'entrybook' => '001',
                        'entry_date' => '2025-08-13',
                        'vehicle_number' => 'MH04JU9931',
                        'route_from' => 'J N P T / SARIGAM / 1X20',
                        'product_name' => 'AS PER INVOICES',
                        'weight' => 1,
                        'rate' => 24000,
                        'advance_paid' => 12000,
                        'empty_container_charge' => 2386,
                    ],
                    [
                        'entrybook' => '002',
                        'entry_date' => '2025-08-14',
                        'vehicle_number' => 'MH04JU9932',
                        'route_from' => 'J N P T / SARIGAM / 1X20',
                        'product_name' => 'AS PER INVOICES',
                        'weight' => 1,
                        'rate' => 24000,
                        'advance_paid' => 15000,
                        'empty_container_charge' => 0,
                    ],
                ],
            ],
            [
                'bill_number' => 'R2526-0609',
                'party_index' => 1,
                'invoice_date' => '2025-09-10',
                'status' => 'draft',
                'prepared_by' => 'Admin',
                'checked_by' => null,
                'lines' => [
                    [
                        'entrybook' => '003',
                        'entry_date' => '2025-08-20',
                        'vehicle_number' => 'MH04JU9931',
                        'route_from' => 'NHAVA SHEVA / VAPI',
                        'product_name' => 'AS PER INVOICES',
                        'weight' => 1,
                        'rate' => 18500,
                        'advance_paid' => 10000,
                        'empty_container_charge' => 1200,
                    ],
                ],
            ],
            [
                'bill_number' => 'R2526-0610',
                'party_index' => 0,
                'invoice_date' => '2025-09-15',
                'status' => 'finalized',
                'prepared_by' => 'Admin',
                'checked_by' => 'Manager',
                'lines' => [
                    [
                        'entrybook' => '004',
                        'entry_date' => '2025-08-25',
                        'vehicle_number' => 'MH04JU9932',
                        'route_from' => 'MUNDRA / HAZIRA',
                        'product_name' => 'AS PER INVOICES',
                        'weight' => 1,
                        'rate' => 22000,
                        'advance_paid' => 11000,
                        'empty_container_charge' => 1500,
                    ],
                ],
            ],
        ];

        $entryNumbersForSequence = [];

        foreach ($invoices as $invoiceData) {
            [$totals, $lineFreights] = FreightInvoiceCalculator::forPersistence(
                $invoiceData['lines'],
                (float) $company->igst_rate,
            );

            $invoice = FreightInvoice::query()->updateOrCreate(
                ['bill_number' => $invoiceData['bill_number']],
                [
                    'user_id' => $userId,
                    'company_id' => $company->id,
                    'party_id' => $parties[$invoiceData['party_index']]->id,
                    'invoice_date' => $invoiceData['invoice_date'],
                    'sac_code' => $company->sac_code,
                    'status' => $invoiceData['status'],
                    'igst_rate' => $company->igst_rate,
                    ...$totals,
                    'balance_in_words' => AmountInWords::rupees($totals['balance_amount']),
                    'prepared_by' => $invoiceData['prepared_by'],
                    'checked_by' => $invoiceData['checked_by'],
                ],
            );

            $invoice->lines()->delete();

            foreach ($invoiceData['lines'] as $index => $line) {
                $entrybook = $entrybooks[$line['entrybook']] ?? null;
                $entryNumbersForSequence[] = $line['entrybook'];

                $invoice->lines()->create([
                    'serial_number' => $index + 1,
                    'entrybook_id' => $entrybook?->id,
                    'entry_number' => $line['entrybook'],
                    'entry_date' => $line['entry_date'],
                    'vehicle_number' => $line['vehicle_number'],
                    'route_from' => $line['route_from'],
                    'product_name' => $line['product_name'],
                    'weight' => $line['weight'],
                    'rate' => $line['rate'],
                    'freight' => $lineFreights[$index],
                    'advance_paid' => $line['advance_paid'],
                    'empty_container_charge' => $line['empty_container_charge'],
                ]);
            }
        }

        EntryNumberGenerator::syncCompanySequence($company->fresh(), $entryNumbersForSequence);
    }

    private function seedInvoicePayments(int $userId): void
    {
        $payments = [
            [
                'bill_number' => 'R2526-0608',
                'payment_date' => '2025-09-10',
                'amount' => 15000,
                'payment_mode' => 'neft',
                'reference_no' => 'UTR9827364510',
                'notes' => 'Partial payment against first invoice',
            ],
            [
                'bill_number' => 'R2526-0609',
                'payment_date' => '2025-09-12',
                'amount' => 5000,
                'payment_mode' => 'upi',
                'reference_no' => 'UPI-445566',
                'notes' => null,
            ],
        ];

        foreach ($payments as $paymentData) {
            $invoice = FreightInvoice::query()
                ->where('user_id', $userId)
                ->where('bill_number', $paymentData['bill_number'])
                ->first();

            if (! $invoice) {
                continue;
            }

            InvoicePayment::query()->updateOrCreate(
                [
                    'user_id' => $userId,
                    'freight_invoice_id' => $invoice->id,
                    'reference_no' => $paymentData['reference_no'],
                ],
                [
                    'party_id' => $invoice->party_id,
                    'payment_date' => $paymentData['payment_date'],
                    'amount' => $paymentData['amount'],
                    'payment_mode' => $paymentData['payment_mode'],
                    'notes' => $paymentData['notes'],
                ],
            );
        }
    }

    /** @param  array<string, Vehicle>  $vehicles
     * @param  list<Party>  $parties
     * @return array<string, Entrybook>
     */
    private function seedEntrybooks(int $userId, array $vehicles, array $parties): array
    {
        $entries = [
            [
                'entry_number' => '001',
                'entry_date' => '2025-08-13',
                'vehicle_number' => 'MH04JU9931',
                'party_index' => 0,
                'route_from' => 'J N P T / SARIGAM / 1X20',
                'freight' => 24000,
                'advance' => 12000,
            ],
            [
                'entry_number' => '002',
                'entry_date' => '2025-08-14',
                'vehicle_number' => 'MH04JU9932',
                'party_index' => 0,
                'route_from' => 'J N P T / SARIGAM / 1X20',
                'freight' => 24000,
                'advance' => 15000,
            ],
            [
                'entry_number' => '003',
                'entry_date' => '2025-08-20',
                'vehicle_number' => 'MH04JU9931',
                'party_index' => 0,
                'route_from' => 'NHAVA SHEVA / VAPI',
                'freight' => 18500,
                'advance' => 10000,
            ],
            [
                'entry_number' => '004',
                'entry_date' => '2025-08-25',
                'vehicle_number' => 'MH04JU9932',
                'party_index' => 1,
                'route_from' => 'MUNDRA / HAZIRA',
                'freight' => 22000,
                'advance' => 11000,
            ],
        ];

        $result = [];

        foreach ($entries as $row) {
            $freight = (float) $row['freight'];
            $advance = (float) $row['advance'];

            $result[$row['entry_number']] = Entrybook::query()->updateOrCreate(
                [
                    'user_id' => $userId,
                    'entry_number' => $row['entry_number'],
                ],
                [
                    'entry_date' => $row['entry_date'],
                    'vehicle_id' => $vehicles[$row['vehicle_number']]->id,
                    'party_id' => $parties[$row['party_index']]->id ?? null,
                    'route_from' => $row['route_from'],
                    'freight' => $freight,
                    'advance' => $advance,
                    'balance' => round($freight - $advance, 2),
                ],
            );
        }

        return $result;
    }

    /** @param  array<string, Vehicle>  $vehicles */
    private function seedVehicleExpenses(int $userId, array $vehicles): void
    {
        $rows = [
            [
                'expense_date' => '2025-08-13',
                'vehicle_number' => 'MH04JU9931',
                'freight' => 24000,
                'advance' => 12000,
                'empty_charge' => 2386,
                'toll' => 850,
                'maintenance' => 500,
            ],
            [
                'expense_date' => '2025-08-14',
                'vehicle_number' => 'MH04JU9932',
                'freight' => 24000,
                'advance' => 15000,
                'empty_charge' => 0,
                'toll' => 650,
                'maintenance' => 300,
            ],
            [
                'expense_date' => '2025-08-20',
                'vehicle_number' => 'MH04JU9931',
                'freight' => 18500,
                'advance' => 10000,
                'empty_charge' => 1200,
                'toll' => 720,
                'maintenance' => 450,
            ],
            [
                'expense_date' => '2025-08-25',
                'vehicle_number' => 'MH04JU9932',
                'freight' => 22000,
                'advance' => 11000,
                'empty_charge' => 1500,
                'toll' => 900,
                'maintenance' => 600,
            ],
        ];

        foreach ($rows as $row) {
            $freight = (float) $row['freight'];
            $advance = (float) $row['advance'];
            $emptyCharge = (float) $row['empty_charge'];
            $toll = (float) $row['toll'];
            $maintenance = (float) $row['maintenance'];

            VehicleExpense::query()->updateOrCreate(
                [
                    'user_id' => $userId,
                    'expense_date' => $row['expense_date'],
                    'vehicle_id' => $vehicles[$row['vehicle_number']]->id,
                ],
                [
                    'freight' => $freight,
                    'advance' => $advance,
                    'empty_charge' => $emptyCharge,
                    'toll' => $toll,
                    'maintenance' => $maintenance,
                    'balance' => VehicleExpenseCalculator::balance(
                        $freight,
                        $advance,
                        $emptyCharge,
                        $toll,
                        $maintenance,
                    ),
                ],
            );
        }
    }

    /** @param  array<string, Vehicle>  $vehicles */
    private function seedVehicleDocuments(int $userId, array $vehicles): void
    {
        $sets = [
            'MH04JU9931' => [
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
            ],
            'MH04JU9932' => [
                [
                    'document_type' => 'insurance',
                    'title' => 'Insurance policy 2026',
                    'filename' => 'insurance-policy.pdf',
                    'expiry_date' => '2026-09-15',
                    'notes' => null,
                ],
                [
                    'document_type' => 'pollution',
                    'title' => 'PUC certificate',
                    'filename' => 'puc-certificate.pdf',
                    'expiry_date' => '2026-06-01',
                    'notes' => null,
                ],
            ],
        ];

        foreach ($sets as $vehicleNumber => $documents) {
            $vehicle = $vehicles[$vehicleNumber];

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
    }

    /** @param  array<string, Driver>  $drivers */
    private function seedDriverDocuments(int $userId, array $drivers): void
    {
        $sets = [
            'rajesh-patel' => [
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
            ],
            'suresh-sharma' => [
                [
                    'document_type' => 'license',
                    'title' => 'Driving license',
                    'filename' => 'driving-license.pdf',
                    'expiry_date' => '2027-11-20',
                    'notes' => null,
                ],
                [
                    'document_type' => 'pan',
                    'title' => 'PAN card',
                    'filename' => 'pan-card.pdf',
                    'expiry_date' => null,
                    'notes' => null,
                ],
            ],
        ];

        foreach ($sets as $driverKey => $documents) {
            $driver = $drivers[$driverKey];

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
