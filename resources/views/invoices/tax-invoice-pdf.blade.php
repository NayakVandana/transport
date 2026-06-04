@php
    use App\Support\ListExport;
    use App\Support\TaxInvoicePdf;

    $addressLines = array_values(array_filter(preg_split("/\r\n|\r|\n/", (string) ($party->address ?? '')) ?: []));
    $companyAddressLines = array_values(array_filter(preg_split("/\r\n|\r|\n/", (string) ($company->address ?? '')) ?: []));

    $display = static function ($value): string {
        if ($value === null || $value === '') {
            return '-';
        }

        if (is_string($value) && trim($value) === '') {
            return '-';
        }

        return (string) $value;
    };
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Tax Invoice {{ $invoice->bill_number }}</title>
    <style>
        @page { margin: 10mm 8mm; }

        * { box-sizing: border-box; }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 9px;
            line-height: 1.35;
            color: #000;
            margin: 0;
        }

        table { width: 100%; border-collapse: collapse; }

        td, th {
            vertical-align: top;
            padding: 2px 3px;
        }

        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .nowrap { white-space: nowrap; }

        .title {
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 1px;
            padding: 6px 0;
        }

        .company-name {
            font-size: 12px;
            font-weight: bold;
            padding: 10px 0;
        }

        .rule-single td {
            border-top: 1px solid #000;
            height: 1px;
            line-height: 0;
            font-size: 0;
            padding: 0;
        }

        .rule-double td {
            border-top: 3px double #000;
            height: 1px;
            line-height: 0;
            font-size: 0;
            padding: 0;
        }

        .section-gap td { padding-top: 8px; padding-bottom: 8px; }

        .meta-table { width: 190px; }
        .meta-table td { padding: 1px 0; }

        .lines-table {
            table-layout: fixed;
            width: 100%;
            font-size: 8px;
            margin-top: 6px;
            margin-bottom: 6px;
        }

        .lines-table th {
            border-bottom: 1px solid #000;
            font-weight: normal;
            text-align: left;
            padding: 4px 2px;
            word-wrap: break-word;
        }

        .lines-table th.right { text-align: right; }

        .lines-table td {
            padding: 4px 2px;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }

        .col-srl { width: 4%; }
        .col-entry { width: 10%; }
        .col-date { width: 10%; }
        .col-vehicle { width: 10%; }
        .col-from { width: 10%; }
        .col-product { width: 22%; }
        .col-weight { width: 8%; }
        .col-rate { width: 10%; }
        .col-freight { width: 10%; }

        .sub-line td {
            font-size: 7.5px;
            padding: 2px 2px 4px 2px;
            text-align: right;
        }

        .summary-wrap { width: 100%; margin-top: 4px; }
        .summary-wrap .summary-spacer { width: 65%; }
        .summary-wrap .summary-cell { width: 35%; vertical-align: top; }
        .summary {
            width: 210px;
            margin-left: auto;
        }

        .summary td { padding: 2px 0; }
        .summary .label { text-align: right; padding-right: 10px; }
        .summary .value { text-align: right; white-space: nowrap; }
        .summary-divider td {
            border-top: 1px solid #000;
            padding-top: 4px;
        }

        .footer-note {
            font-size: 8px;
            line-height: 1.25;
            max-width: 240px;
        }

        .amount-words {
            padding: 8px 0;
            font-weight: bold;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    {{-- Header --}}
    <table>
        <tr class="rule-double"><td colspan="2">&nbsp;</td></tr>
        <tr>
            <td colspan="2" class="center title">TAX INVOICE</td>
        </tr>
        <tr class="rule-double"><td colspan="2">&nbsp;</td></tr>
    </table>

    {{-- Party + bill meta --}}
    <table>
        <tr class="section-gap">
            <td style="width: 55%; padding-right: 10px;">
                <div>To,</div>
                <div class="bold" style="margin-top: 3px;">{{ $party->name }}</div>
                @foreach ($addressLines as $line)
                    <div>{{ $line }}</div>
                @endforeach
                @if ($party->state_code)
                    <div>{{ $party->state_code }}</div>
                @endif
                @php
                    $mobileNumbers = $party->mobiles ?? ($party->mobile ? [$party->mobile] : []);
                @endphp
                @if ($mobileNumbers !== [])
                    <div style="margin-top: 3px;">Mob: {{ implode(', ', $mobileNumbers) }}</div>
                @endif
            </td>
            <td style="width: 45%;" align="right">
                <table class="meta-table">
                    <tr>
                        <td class="nowrap">Bill No.</td>
                        <td>: {{ $invoice->bill_number }}</td>
                    </tr>
                    <tr>
                        <td class="nowrap">Date</td>
                        <td>: {{ ListExport::formatDate($invoice->invoice_date) }}</td>
                    </tr>
                    <tr>
                        <td class="nowrap">SAC Code</td>
                        <td>: {{ $display($invoice->sac_code) }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <table>
        <tr class="rule-single"><td>&nbsp;</td></tr>
        <tr>
            <td class="center section-gap">
                Being The Amount Of Freight Charges For The Transportation Of Your Consignment.
            </td>
        </tr>
        <tr class="rule-single"><td>&nbsp;</td></tr>
    </table>

    {{-- Line items (full-width table, not nested) --}}
    <table class="lines-table">
        <thead>
            <tr>
                <th class="col-srl">Srl</th>
                <th class="col-entry">Entry No.</th>
                <th class="col-date">Date</th>
                <th class="col-vehicle">Vehicle</th>
                <th class="col-from">From</th>
                <th class="col-to">To</th>
                <th class="col-product">Product Name</th>
                <th class="col-weight right">Weight</th>
                <th class="col-rate right">Rate</th>
                <th class="col-freight right">Freight</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($lines as $index => $row)
                <tr>
                    <td class="center">{{ $index + 1 }}</td>
                    <td>{{ $display($row->entry_number) }}</td>
                    <td class="nowrap">{{ $row->entry_date ? ListExport::formatDate($row->entry_date) : '-' }}</td>
                    <td>{{ $display($row->vehicle_number) }}</td>
                    <td>{{ $display($row->route_from) }}</td>
                    <td>{{ $display($row->route_to) }}</td>
                    <td>{{ $display($row->product_name) }}</td>
                    <td class="right nowrap">{{ number_format((float) $row->weight, 3, '.', ',') }}</td>
                    <td class="right nowrap">{{ ListExport::formatMoney($row->rate) }}</td>
                    <td class="right nowrap">{{ ListExport::formatMoney(TaxInvoicePdf::lineFreight($row)) }}</td>
                </tr>
                @if ((float) $row->advance_paid > 0 || (float) $row->empty_container_charge > 0 || (float) $row->detention > 0 || (float) $row->weightman > 0 || (float) $row->parking > 0)
                    <tr class="sub-line">
                        <td colspan="10" class="right">
                            @if ((float) $row->advance_paid > 0)
                                Advance : {{ ListExport::formatMoney($row->advance_paid) }}
                            @endif
                            @if ((float) $row->empty_container_charge > 0)
                                @if ((float) $row->advance_paid > 0) &nbsp;&nbsp; @endif
                                EMPTY CONTAINER CHARGE : {{ ListExport::formatMoney($row->empty_container_charge) }}
                            @endif
                            @if ((float) $row->detention > 0)
                                @if ((float) $row->advance_paid > 0 || (float) $row->empty_container_charge > 0) &nbsp;&nbsp; @endif
                                DETENTION : {{ ListExport::formatMoney($row->detention) }}
                            @endif
                            @if ((float) $row->weightman > 0)
                                @if ((float) $row->advance_paid > 0 || (float) $row->empty_container_charge > 0 || (float) $row->detention > 0) &nbsp;&nbsp; @endif
                                WEIGHTMAN : {{ ListExport::formatMoney($row->weightman) }}
                            @endif
                            @if ((float) $row->parking > 0)
                                @if ((float) $row->advance_paid > 0 || (float) $row->empty_container_charge > 0 || (float) $row->detention > 0 || (float) $row->weightman > 0) &nbsp;&nbsp; @endif
                                PARKING : {{ ListExport::formatMoney($row->parking) }}
                            @endif
                        </td>
                    </tr>
                @endif
            @empty
                <tr>
                    <td colspan="9" class="center" style="padding: 10px 0;">No line items.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <table>
        <tr class="rule-single"><td>&nbsp;</td></tr>
    </table>

    {{-- Summary --}}
    <table class="summary-wrap">
        <tr>
            <td class="summary-spacer">&nbsp;</td>
            <td class="summary-cell" align="right">
                <table class="summary">
                    <tr>
                        <td class="label">Total Weight</td>
                        <td class="value">: {{ number_format((float) $invoice->total_weight, 3, '.', ',') }}</td>
                    </tr>
                    <tr>
                        <td class="label">Total Freight</td>
                        <td class="value">: {{ ListExport::formatMoney($invoice->total_freight) }}</td>
                    </tr>
                    @if ((float) $invoice->total_empty_container_charge > 0)
                        <tr>
                            <td class="label">Empty Container Charge</td>
                            <td class="value">: {{ ListExport::formatMoney($invoice->total_empty_container_charge) }}</td>
                        </tr>
                    @endif
                    @if ((float) $invoice->total_detention > 0)
                        <tr>
                            <td class="label">Detention</td>
                            <td class="value">: {{ ListExport::formatMoney($invoice->total_detention) }}</td>
                        </tr>
                    @endif
                    @if ((float) $invoice->total_weightman > 0)
                        <tr>
                            <td class="label">Weightman</td>
                            <td class="value">: {{ ListExport::formatMoney($invoice->total_weightman) }}</td>
                        </tr>
                    @endif
                    @if ((float) $invoice->total_parking > 0)
                        <tr>
                            <td class="label">Parking</td>
                            <td class="value">: {{ ListExport::formatMoney($invoice->total_parking) }}</td>
                        </tr>
                    @endif
                    <tr>
                        <td class="label">Net Value</td>
                        <td class="value">: {{ ListExport::formatMoney($invoice->net_value) }}</td>
                    </tr>
                    <tr>
                        <td class="label">Advance</td>
                        <td class="value">: {{ ListExport::formatMoney($invoice->total_advance) }}</td>
                    </tr>
                    <tr class="summary-divider">
                        <td colspan="2">&nbsp;</td>
                    </tr>
                    <tr>
                        <td class="label bold">Balance</td>
                        <td class="value bold">: {{ ListExport::formatMoney($invoice->balance_amount) }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <table>
        <tr class="rule-double"><td>&nbsp;</td></tr>
    </table>

    @if ($invoice->balance_in_words)
        <table>
            <tr>
                <td class="amount-words">{{ $invoice->balance_in_words }}</td>
            </tr>
        </table>
    @endif

    {{-- Tax / registration --}}
    <table>
        <tr class="section-gap">
            <td>
                @if ($company->pan)
                    <div>PAN NO. : {{ $company->pan }}</div>
                @endif
                @if ($company->gst)
                    <div>GST NO. : {{ $company->gst }}</div>
                @endif
                @if ($company->udyam_reg_no)
                    <div>
                        UDYAM REG NO. : {{ $company->udyam_reg_no }}
                        @if ($company->udyam_date)
                            &nbsp;&nbsp;&nbsp;&nbsp;DATE : {{ ListExport::formatDate($company->udyam_date) }}
                        @endif
                    </div>
                @endif
                @if ($company->jurisdiction)
                    <div style="margin-top: 3px;">{{ $company->jurisdiction }}</div>
                @endif
            </td>
        </tr>
    </table>

    @if ($company->bank_account_no)
        <table>
            <tr>
                <td style="padding-bottom: 8px;">
                    <div>
                        A/C NO. : {{ $company->bank_account_no }}
                        @if ($company->bank_ifsc)
                            &nbsp;&nbsp;&nbsp;&nbsp;IFSC : {{ $company->bank_ifsc }}
                        @endif
                    </div>
                    <div>
                        {{ $display($company->bank_name) }}
                        @if ($company->bank_branch)
                            - {{ $company->bank_branch }}
                        @endif
                    </div>
                </td>
            </tr>
        </table>
    @endif

    <table>
        <tr class="rule-single"><td>&nbsp;</td></tr>
    </table>

    {{-- Footer --}}
    <table>
        <tr class="section-gap">
            <td style="width: 50%; padding-right: 10px;">
                <div>Gross Freight : {{ ListExport::formatMoney($invoice->gross_freight) }}</div>
                <div>
                    IGST @ {{ number_format((float) $invoice->igst_rate, 4, '.', '') }}% :
                    {{ ListExport::formatMoney($invoice->igst_amount) }}
                </div>
                <div class="footer-note" style="margin-top: 6px;">
                    TOTAL GST TO BE PAID UNDER REVERSE CHARGE BY RECIPIENT
                </div>
            </td>
            <td style="width: 50%;">
                <div>Prepared By : {{ $display($invoice->prepared_by) === '-' ? '' : $invoice->prepared_by }}</div>
                <div style="margin-top: 16px;">Checked By : {{ $display($invoice->checked_by) === '-' ? '' : $invoice->checked_by }}</div>
                <div style="margin-top: 22px;">Authorised Signatory</div>
            </td>
        </tr>
    </table>

    <table>
        <tr class="rule-double"><td>&nbsp;</td></tr>
        <tr>
            <td class="center company-name">{{ $company->name }}</td>
        </tr>
        @if (count($companyAddressLines) > 0)
            <tr>
                <td class="center" style="font-size: 8px; padding-bottom: 6px;">
                    @foreach ($companyAddressLines as $line)
                        <div>{{ $line }}</div>
                    @endforeach
                </td>
            </tr>
        @endif
    </table>
</body>
</html>
