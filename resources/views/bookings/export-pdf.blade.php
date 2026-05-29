<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Bookings Report</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #111; }
        h1 { font-size: 18px; margin: 0 0 4px; }
        .meta { font-size: 10px; color: #555; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; }
        th { background: #f3f4f6; text-align: left; font-size: 10px; text-transform: uppercase; }
        td.num { text-align: right; }
        tfoot td { font-weight: bold; background: #f9fafb; }
        .totals-box { margin-top: 14px; width: 280px; margin-left: auto; }
        .totals-box table { border: none; }
        .totals-box td { border: none; padding: 4px 0; }
        .totals-box td:last-child { text-align: right; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Bookings Report</h1>
    <div class="meta">
        {{ $filterSummary }}<br>
        Generated: {{ $generatedAt }} | Total records: {{ $totals['count'] }}
    </div>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th class="num">Freight</th>
                <th class="num">Advance</th>
                <th class="num">Empty</th>
                <th class="num">Maintenance</th>
                <th class="num">Balance</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($bookings as $booking)
                <tr>
                    <td>{{ $booking->booking_date->format('d-m-Y') }}</td>
                    <td>{{ $booking->vehicle?->vehicle_number ?? '—' }}</td>
                    <td>{{ $booking->driver?->name ?? '—' }}</td>
                    <td class="num">{{ $money($booking->freight) }}</td>
                    <td class="num">{{ $money($booking->advance) }}</td>
                    <td class="num">{{ $money($booking->empty_charge) }}</td>
                    <td class="num">{{ $money($booking->maintenance) }}</td>
                    <td class="num">{{ $money($booking->balance) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="8" style="text-align:center;">No bookings found.</td>
                </tr>
            @endforelse
        </tbody>
        @if ($totals['count'] > 0)
            <tfoot>
                <tr>
                    <td colspan="3">Grand Total ({{ $totals['count'] }} bookings)</td>
                    <td class="num">{{ $money($totals['freight']) }}</td>
                    <td class="num">{{ $money($totals['advance']) }}</td>
                    <td class="num">{{ $money($totals['empty_charge']) }}</td>
                    <td class="num">{{ $money($totals['maintenance']) }}</td>
                    <td class="num">{{ $money($totals['balance']) }}</td>
                </tr>
            </tfoot>
        @endif
    </table>

    <div class="totals-box">
        <table>
            <tr><td>Total Freight</td><td>₹ {{ $money($totals['freight']) }}</td></tr>
            <tr><td>Total Advance</td><td>₹ {{ $money($totals['advance']) }}</td></tr>
            <tr><td>Total Empty</td><td>₹ {{ $money($totals['empty_charge']) }}</td></tr>
            <tr><td>Total Maintenance</td><td>₹ {{ $money($totals['maintenance']) }}</td></tr>
            <tr><td>Total Balance</td><td>₹ {{ $money($totals['balance']) }}</td></tr>
        </table>
    </div>
</body>
</html>
