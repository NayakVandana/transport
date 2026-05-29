<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #111; }
        h1 { font-size: 18px; margin: 0 0 4px; }
        .meta { font-size: 10px; color: #555; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; }
        th { background: #f3f4f6; text-align: left; font-size: 10px; text-transform: uppercase; }
        td.num { text-align: right; }
        tfoot td { font-weight: bold; background: #f9fafb; }
        .summary-box { margin-top: 14px; width: 280px; margin-left: auto; }
        .summary-box table { border: none; }
        .summary-box td { border: none; padding: 4px 0; }
        .summary-box td:last-child { text-align: right; font-weight: bold; }
    </style>
</head>
<body>
    <h1>{{ $title }}</h1>
    <div class="meta">
        {{ $filterSummary }}<br>
        Generated: {{ $generatedAt }} | Total records: {{ $recordCount }}
    </div>

    <table>
        <thead>
            <tr>
                @foreach ($headers as $header)
                    <th>{{ $header }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $row)
                <tr>
                    @foreach ($row as $cell)
                        <td>{{ $cell === '' ? '—' : $cell }}</td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td colspan="{{ count($headers) }}" style="text-align:center;">No records found.</td>
                </tr>
            @endforelse
        </tbody>
        @if ($footerRow)
            <tfoot>
                <tr>
                    @foreach ($footerRow as $cell)
                        <td>{{ $cell }}</td>
                    @endforeach
                </tr>
            </tfoot>
        @endif
    </table>

    @if (count($summaryLines) > 0)
        <div class="summary-box">
            <table>
                @foreach ($summaryLines as $line)
                    <tr>
                        <td>{{ $line['label'] }}</td>
                        <td>{{ $line['value'] }}</td>
                    </tr>
                @endforeach
            </table>
        </div>
    @endif
</body>
</html>
