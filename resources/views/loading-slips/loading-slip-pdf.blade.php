<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Loading Slip</title>
    <style>
        @page { margin: 12mm 10mm; }

        * { box-sizing: border-box; }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            line-height: 1.35;
            color: #111;
            margin: 0;
        }

        table { width: 100%; border-collapse: collapse; }

        td, th { vertical-align: top; padding: 4px 6px; }

        .header-table td { border: none; padding: 2px 4px; }

        .logo-cell { width: 55%; }
        .title-cell { width: 45%; text-align: right; }

        .company-name {
            font-size: 18px;
            font-weight: bold;
            font-family: DejaVu Serif, serif;
            color: #1e3a8a;
            margin-top: 6px;
        }

        .slip-title {
            font-size: 22px;
            font-weight: bold;
            color: #1d4ed8;
            letter-spacing: 1px;
            text-align: right;
        }

        .title-rule {
            border-bottom: 2px solid #1d4ed8;
            margin-top: 4px;
            margin-bottom: 8px;
        }

        .date-box {
            border: 1px solid #333;
            margin-left: auto;
            width: 200px;
        }

        .date-box td {
            border: 1px solid #333;
            padding: 4px 8px;
            font-size: 10px;
        }

        .date-box .label { font-weight: bold; width: 45%; }

        .office-address {
            text-align: center;
            font-size: 10px;
            margin: 10px 0 12px;
            line-height: 1.5;
        }

        .route-bar {
            background: #1e3a8a;
            color: #fff;
            font-weight: bold;
            font-size: 12px;
            padding: 6px 10px;
        }

        .route-row td { border: none; padding: 0; width: 50%; }

        .route-meta {
            font-size: 11px;
            padding: 6px 4px 10px;
        }

        .lines-table th {
            background: #1e3a8a;
            color: #fff;
            font-size: 10px;
            text-align: center;
            border: 1px solid #1e3a8a;
            padding: 6px 4px;
        }

        .lines-table td {
            border: 1px solid #333;
            text-align: center;
            padding: 6px 4px;
        }

        .lines-table td.num { text-align: right; }

        .lines-table tfoot td {
            font-weight: bold;
            background: #f3f4f6;
        }

        .footer-table { margin-top: 16px; }
        .footer-table td { border: none; padding: 4px; vertical-align: bottom; }

        .summary-box { width: 220px; }
        .summary-box table { border-collapse: collapse; width: 100%; }
        .summary-box td {
            border: 1px solid #333;
            padding: 6px 10px;
            font-weight: bold;
            font-size: 11px;
        }
        .summary-box .label-cell { background: #d1fae5; }
        .summary-box .value-cell { background: #fef08a; text-align: right; }

        .sign-block {
            text-align: right;
            font-size: 11px;
        }

        .sign-block .sign-title {
            font-weight: bold;
            margin-bottom: 24px;
        }
    </style>
</head>
<body>
    @php
        $display = static function ($value): string {
            if ($value === null || $value === '') {
                return '—';
            }

            return (string) $value;
        };

        $formatDate = static function ($value): string {
            if ($value === null || $value === '') {
                return '—';
            }

            try {
                return \Carbon\Carbon::parse($value)->format('d-m-Y');
            } catch (\Throwable) {
                return (string) $value;
            }
        };

        $formatMoney = static function ($value): string {
            if ($value === null || $value === '') {
                return '0';
            }

            return number_format((float) $value, 0, '.', '');
        };

        $officeAddress = trim((string) ($company->full_address ?? $company->address ?? ''));
        $email = $contactEmail ?? '';
    @endphp

    <table class="header-table">
        <tr>
            <td class="logo-cell">
                @if (! empty($company?->logo_url))
                    <img src="{{ $company->logo_url }}" alt="" style="max-height: 56px; max-width: 120px;">
                @endif
                <div class="company-name">{{ $display($company?->name) }}</div>
            </td>
            <td class="title-cell">
                <div class="slip-title">LOADING SLIP</div>
                <div class="title-rule"></div>
                <table class="date-box">
                    <tr>
                        <td class="label">DATE</td>
                        <td>{{ $formatDate($slip->slip_date) }}</td>
                    </tr>
                    <tr>
                        <td class="label">Loading date</td>
                        <td>{{ $formatDate($slip->loading_date) }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    @if ($officeAddress !== '')
        <div class="office-address">{!! nl2br(e($officeAddress)) !!}</div>
    @endif

    <table class="route-row">
        <tr>
            <td>
                <div class="route-bar">FROM: {{ strtoupper($display($slip->route_from)) }}</div>
                <div class="route-meta">M/S: {{ strtoupper($display($party?->name)) }}</div>
            </td>
            <td>
                <div class="route-bar">TO: {{ strtoupper($display($slip->route_to)) }}</div>
                <div class="route-meta">
                    @if ($email !== '')
                        E-Mail : {{ $email }}
                    @endif
                </div>
            </td>
        </tr>
    </table>

    <table class="lines-table">
        <thead>
            <tr>
                <th style="width: 8%;">Sr No</th>
                <th style="width: 22%;">Vehicle No</th>
                <th style="width: 22%;">Destination</th>
                <th style="width: 16%;">Freight rate</th>
                <th style="width: 16%;">Advance</th>
                <th style="width: 16%;">Balance</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($lines as $line)
                <tr>
                    <td>{{ $line->serial_number }}</td>
                    <td>{{ $display($line->vehicle_number) }}</td>
                    <td>{{ strtoupper($display($line->destination)) }}</td>
                    <td class="num">{{ $formatMoney($line->freight_rate) }}</td>
                    <td class="num">{{ $formatMoney($line->advance) }}</td>
                    <td class="num">{{ $formatMoney($line->balance) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="6">No vehicles listed.</td>
                </tr>
            @endforelse
        </tbody>
        @if ($lines->isNotEmpty())
            <tfoot>
                <tr>
                    <td colspan="3" style="text-align: right;">TOTAL</td>
                    <td class="num">{{ $formatMoney($slip->total_freight) }}</td>
                    <td class="num">{{ $formatMoney($slip->total_advance) }}</td>
                    <td class="num">{{ $formatMoney($slip->total_balance) }}</td>
                </tr>
            </tfoot>
        @endif
    </table>

    <table class="footer-table">
        <tr>
            <td style="width: 55%;">
                <div class="summary-box">
                    <table>
                        <tr>
                            <td class="label-cell">TOTAL FREIGHT</td>
                            <td class="value-cell">{{ $formatMoney($slip->total_freight) }}</td>
                        </tr>
                        <tr>
                            <td class="label-cell">TOTAL ADVANCE</td>
                            <td class="value-cell">{{ $formatMoney($slip->total_advance) }}</td>
                        </tr>
                    </table>
                </div>
            </td>
            <td style="width: 45%;">
                <div class="sign-block">
                    <div class="sign-title">AUTHORISED SIGN</div>
                    <div>{{ strtoupper($display($slip->authorized_signatory)) }}</div>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
