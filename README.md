# Transport & Logistics Management

Laravel 12 + Inertia + React application for freight tax invoicing, modeled on Indian transport billing (consignment lines, advances, empty container charges, IGST).

## Features

- **Company profile** — PAN, GST, Udyam, bank details, SAC code, IGST rate
- **Party** — billing party with address and mobile
- **Tax invoices** — multi-line consignments with auto-calculated freight, totals, balance, amount in words
- **Print view** — monospace layout matching legacy ERP-style tax invoices

## Setup

```bash
cd D:\transport
composer install
cp .env.example .env
php artisan key:generate
# Configure DB in .env, then:
php artisan migrate --seed
npm install
npm run build
php artisan serve
```

Login: `test@example.com` / `password` (from Breeze factory).

Dev (server + Vite):

```bash
composer run dev
```

## Database

| Table | Purpose |
|-------|---------|
| `companies` | Issuer (transport company) legal & bank details |
| `parties` | Invoice party (bill-to) |
| `freight_invoices` | Tax invoice header & totals |
| `freight_invoice_lines` | Consignment rows (vehicle, route, weight × rate, advance, empty container) |

## Calculations

- Freight = Weight × Rate  
- Net Value = Total Freight + Empty Container Charges  
- Balance = Net Value − Total Advance  
- IGST = Net Value × IGST% (reverse charge note on print)
