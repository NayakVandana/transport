import { Fragment } from 'react';
import { formatAppDateTime } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/freightCalculator';
import type { FreightInvoice, FreightInvoiceLine } from '@/types/transport';

const printStyles = `
@media print {
    .tax-invoice-document {
        box-shadow: none !important;
        margin: 0 !important;
        padding: 0 !important;
        max-width: none !important;
    }
    .tax-invoice-document table {
        page-break-inside: auto;
    }
    .tax-invoice-document tr {
        page-break-inside: avoid;
        page-break-after: auto;
    }
}
`;

function lineFreight(row: FreightInvoiceLine): number {
    if (row.freight != null && row.freight !== '') {
        return Number(row.freight);
    }

    return Number(row.weight) * Number(row.rate);
}

function DoubleRule() {
    return (
        <tr>
            <td colSpan={2} className="border-0 p-0">
                <div className="border-t-[3px] border-double border-black" />
            </td>
        </tr>
    );
}

function SingleRule() {
    return (
        <tr>
            <td colSpan={2} className="border-0 p-0">
                <div className="border-t border-black" />
            </td>
        </tr>
    );
}

export default function TaxInvoiceDocument({
    invoice,
    className = '',
}: {
    invoice: FreightInvoice;
    className?: string;
}) {
    const company = invoice.company!;
    const party = invoice.party!;
    const lines = invoice.lines ?? [];
    const addressLines = (party.address ?? '').split('\n').filter((line) => line.trim() !== '');

    return (
        <div
            className={`tax-invoice-document mx-auto w-full max-w-[210mm] bg-white p-4 text-black shadow sm:p-6 ${className}`}
        >
            <style>{printStyles}</style>

            <table className="w-full border-collapse font-mono text-[11px] leading-snug sm:text-xs">
                <tbody>
                    <DoubleRule />
                    <tr>
                        <td colSpan={2} className="py-2 text-center text-sm font-bold tracking-wide sm:text-base">
                            TAX INVOICE
                        </td>
                    </tr>
                    <DoubleRule />

                    <tr>
                        <td className="w-1/2 align-top py-3 pr-4">
                            <div>To,</div>
                            <div className="mt-1 font-semibold">{party.name}</div>
                            {addressLines.map((line) => (
                                <div key={line}>{line}</div>
                            ))}
                            {party.state_code && <div>{party.state_code}</div>}
                            {party.mobile && <div className="mt-1">Mob: {party.mobile}</div>}
                        </td>
                        <td className="w-1/2 align-top py-3 pl-4">
                            <table className="ml-auto w-full max-w-[14rem] border-collapse">
                                <tbody>
                                    <tr>
                                        <td className="whitespace-nowrap pr-2">Bill No.</td>
                                        <td>: {invoice.bill_number}</td>
                                    </tr>
                                    <tr>
                                        <td className="whitespace-nowrap pr-2">Date</td>
                                        <td>: {formatAppDateTime(invoice.invoice_date, '')}</td>
                                    </tr>
                                    <tr>
                                        <td className="whitespace-nowrap pr-2">SAC Code</td>
                                        <td>: {invoice.sac_code}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>

                    <SingleRule />
                    <tr>
                        <td colSpan={2} className="py-2 text-center">
                            Being The Amount Of Freight Charges For The Transportation Of Your
                            Consignment.
                        </td>
                    </tr>
                    <SingleRule />

                    <tr>
                        <td colSpan={2} className="p-0">
                            <table className="mt-3 w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-black">
                                        <th className="px-1 py-1 text-left font-normal">Srl</th>
                                        <th className="px-1 py-1 text-left font-normal">Entry No.</th>
                                        <th className="px-1 py-1 text-left font-normal">Date</th>
                                        <th className="px-1 py-1 text-left font-normal">Vehicle</th>
                                        <th className="px-1 py-1 text-left font-normal">From</th>
                                        <th className="px-1 py-1 text-left font-normal">Product Name</th>
                                        <th className="px-1 py-1 text-right font-normal">Weight</th>
                                        <th className="px-1 py-1 text-right font-normal">Rate</th>
                                        <th className="px-1 py-1 text-right font-normal">Freight</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lines.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="py-4 text-center text-gray-500">
                                                No line items.
                                            </td>
                                        </tr>
                                    ) : (
                                        lines.map((row, index) => (
                                            <Fragment key={row.id ?? `line-${index}`}>
                                                <tr className="align-top">
                                                    <td className="px-1 py-1">{index + 1}</td>
                                                    <td className="px-1 py-1">{row.entry_number ?? '—'}</td>
                                                    <td className="whitespace-nowrap px-1 py-1">
                                                        {row.entry_date
                                                            ? formatAppDateTime(row.entry_date, '—')
                                                            : '—'}
                                                    </td>
                                                    <td className="px-1 py-1">{row.vehicle_number ?? '—'}</td>
                                                    <td className="px-1 py-1">{row.route_from ?? '—'}</td>
                                                    <td className="px-1 py-1">{row.product_name ?? '—'}</td>
                                                    <td className="px-1 py-1 text-right">
                                                        {Number(row.weight).toFixed(3)}
                                                    </td>
                                                    <td className="px-1 py-1 text-right">
                                                        {formatMoney(row.rate)}
                                                    </td>
                                                    <td className="px-1 py-1 text-right">
                                                        {formatMoney(lineFreight(row))}
                                                    </td>
                                                </tr>
                                                {(Number(row.advance_paid) > 0 ||
                                                    Number(row.empty_container_charge) > 0) && (
                                                    <tr>
                                                        <td colSpan={9} className="px-1 pb-2 pl-8 text-[10px]">
                                                            {Number(row.advance_paid) > 0 && (
                                                                <span>
                                                                    Advance : {formatMoney(row.advance_paid ?? 0)}
                                                                </span>
                                                            )}
                                                            {Number(row.empty_container_charge) > 0 && (
                                                                <span className="ml-4">
                                                                    EMPTY CONTAINER CHARGE :{' '}
                                                                    {formatMoney(row.empty_container_charge ?? 0)}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </td>
                    </tr>

                    <SingleRule />

                    <tr>
                        <td colSpan={2} className="py-2">
                            <table className="ml-auto w-full max-w-xs border-collapse">
                                <tbody>
                                    <tr>
                                        <td className="py-0.5 pr-4 text-right">Total Weight</td>
                                        <td className="py-0.5 text-right">
                                            : {Number(invoice.total_weight).toFixed(3)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-0.5 pr-4 text-right">Total Freight</td>
                                        <td className="py-0.5 text-right">
                                            : {formatMoney(invoice.total_freight)}
                                        </td>
                                    </tr>
                                    {Number(invoice.total_empty_container_charge) > 0 && (
                                        <tr>
                                            <td className="py-0.5 pr-4 text-right">Empty Container Charge</td>
                                            <td className="py-0.5 text-right">
                                                : {formatMoney(invoice.total_empty_container_charge)}
                                            </td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td className="py-0.5 pr-4 text-right">Net Value</td>
                                        <td className="py-0.5 text-right">: {formatMoney(invoice.net_value)}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-0.5 pr-4 text-right">Advance</td>
                                        <td className="py-0.5 text-right">
                                            : {formatMoney(invoice.total_advance)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan={2} className="py-1">
                                            <div className="ml-auto w-40 border-t border-black" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-0.5 pr-4 text-right font-semibold">Balance</td>
                                        <td className="py-0.5 text-right font-semibold">
                                            : {formatMoney(invoice.balance_amount)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>

                    <DoubleRule />

                    {invoice.balance_in_words && (
                        <tr>
                            <td colSpan={2} className="py-3 font-semibold uppercase">
                                {invoice.balance_in_words}
                            </td>
                        </tr>
                    )}

                    <tr>
                        <td colSpan={2} className="py-2">
                            {company.pan && <div>PAN NO. : {company.pan}</div>}
                            {company.gst && <div>GST NO. : {company.gst}</div>}
                            {company.udyam_reg_no && (
                                <div>
                                    UDYAM REG NO. : {company.udyam_reg_no}
                                    {company.udyam_date
                                        ? `    DATE : ${formatAppDateTime(company.udyam_date, '')}`
                                        : ''}
                                </div>
                            )}
                            {company.jurisdiction && <div className="mt-1">{company.jurisdiction}</div>}
                        </td>
                    </tr>

                    {company.bank_account_no && (
                        <tr>
                            <td colSpan={2} className="pb-3">
                                <div>
                                    A/C NO. : {company.bank_account_no}
                                    {company.bank_ifsc ? `    IFSC : ${company.bank_ifsc}` : ''}
                                </div>
                                <div>
                                    {company.bank_name}
                                    {company.bank_branch ? ` - ${company.bank_branch}` : ''}
                                </div>
                            </td>
                        </tr>
                    )}

                    <SingleRule />

                    <tr>
                        <td className="w-1/2 align-top py-3 pr-4">
                            <div>Gross Freight : {formatMoney(invoice.gross_freight)}</div>
                            <div>
                                IGST @ {Number(invoice.igst_rate).toFixed(4)}% :{' '}
                                {formatMoney(invoice.igst_amount)}
                            </div>
                            <div className="mt-2 max-w-xs text-[10px] leading-tight">
                                TOTAL GST TO BE PAID UNDER REVERSE CHARGE BY RECIPIENT
                            </div>
                        </td>
                        <td className="w-1/2 align-top py-3 pl-4">
                            <div>Prepared By : {invoice.prepared_by ?? ''}</div>
                            <div className="mt-6">Checked By : {invoice.checked_by ?? ''}</div>
                            <div className="mt-8">Authorised Signatory</div>
                        </td>
                    </tr>

                    <DoubleRule />

                    <tr>
                        <td colSpan={2} className="py-4 text-center text-sm font-bold">
                            {company.name}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
