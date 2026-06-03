import { Fragment } from 'react';
import { formatAppDateTime } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/freightCalculator';
import type { FreightInvoice, FreightInvoiceLine } from '@/types/transport';

const documentStyles = `
@media print {
    .tax-invoice-document {
        box-shadow: none !important;
        margin: 0 !important;
        padding: 0 !important;
        max-width: none !important;
        border-radius: 0 !important;
    }
    .tax-invoice-document table {
        page-break-inside: auto;
    }
    .tax-invoice-document tr {
        page-break-inside: avoid;
        page-break-after: auto;
    }
    .tax-invoice-lines-scroll {
        overflow: visible !important;
    }
    .tax-invoice-lines-hint {
        display: none !important;
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
            className={`tax-invoice-document mx-auto w-full min-w-0 max-w-[210mm] rounded-lg bg-white p-3 text-black shadow sm:p-6 ${className}`}
        >
            <style>{documentStyles}</style>

            <table className="w-full min-w-0 border-collapse font-mono text-[10px] leading-snug sm:text-xs">
                <tbody>
                    <DoubleRule />
                    <tr>
                        <td
                            colSpan={2}
                            className="py-2 text-center text-sm font-bold tracking-wide sm:text-base"
                        >
                            TAX INVOICE
                        </td>
                    </tr>
                    <DoubleRule />

                    <tr>
                        <td colSpan={2} className="py-3">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                                <div className="min-w-0 flex-1 break-words">
                                    <div>To,</div>
                                    <div className="mt-1 font-semibold">{party.name}</div>
                                    {addressLines.map((line) => (
                                        <div key={line}>{line}</div>
                                    ))}
                                    {party.state_code && <div>{party.state_code}</div>}
                                    {party.mobile && <div className="mt-1">Mob: {party.mobile}</div>}
                                </div>
                                <div className="w-full shrink-0 sm:w-auto sm:max-w-[14rem]">
                                    <table className="w-full border-collapse sm:ml-auto">
                                        <tbody>
                                            <tr>
                                                <td className="whitespace-nowrap pr-2">Bill No.</td>
                                                <td className="break-all">: {invoice.bill_number}</td>
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
                                </div>
                            </div>
                        </td>
                    </tr>

                    <SingleRule />
                    <tr>
                        <td colSpan={2} className="break-words py-2 text-center">
                            Being The Amount Of Freight Charges For The Transportation Of Your
                            Consignment.
                        </td>
                    </tr>
                    <SingleRule />

                    <tr>
                        <td colSpan={2} className="p-0">
                            <p className="tax-invoice-lines-hint px-1 pb-1 text-[10px] text-gray-500 md:hidden">
                                Swipe horizontally to view all columns →
                            </p>
                            <div className="tax-invoice-lines-scroll -mx-1 overflow-x-auto px-1 sm:mx-0 sm:px-0">
                                <table className="mt-2 min-w-[38rem] w-full border-collapse sm:mt-3">
                                    <thead>
                                        <tr className="border-b border-black">
                                            <th className="px-1 py-1 text-left font-normal">Srl</th>
                                            <th className="px-1 py-1 text-left font-normal">Entry No.</th>
                                            <th className="px-1 py-1 text-left font-normal">Date</th>
                                            <th className="px-1 py-1 text-left font-normal">Vehicle</th>
                                            <th className="px-1 py-1 text-left font-normal">From</th>
                                            <th className="px-1 py-1 text-left font-normal">
                                                Product Name
                                            </th>
                                            <th className="px-1 py-1 text-right font-normal">Weight</th>
                                            <th className="px-1 py-1 text-right font-normal">Rate</th>
                                            <th className="px-1 py-1 text-right font-normal">
                                                Freight
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lines.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={9}
                                                    className="py-4 text-center text-gray-500"
                                                >
                                                    No line items.
                                                </td>
                                            </tr>
                                        ) : (
                                            lines.map((row, index) => (
                                                <Fragment key={row.id ?? `line-${index}`}>
                                                    <tr className="align-top">
                                                        <td className="px-1 py-1">{index + 1}</td>
                                                        <td className="px-1 py-1">
                                                            {row.entry_number ?? '—'}
                                                        </td>
                                                        <td className="whitespace-nowrap px-1 py-1">
                                                            {row.entry_date
                                                                ? formatAppDateTime(row.entry_date, '—')
                                                                : '—'}
                                                        </td>
                                                        <td className="px-1 py-1">
                                                            {row.vehicle_number ?? '—'}
                                                        </td>
                                                        <td className="break-words px-1 py-1">
                                                            {row.route_from ?? '—'}
                                                        </td>
                                                        <td className="break-words px-1 py-1">
                                                            {row.product_name ?? '—'}
                                                        </td>
                                                        <td className="whitespace-nowrap px-1 py-1 text-right">
                                                            {Number(row.weight).toFixed(3)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-1 py-1 text-right">
                                                            {formatMoney(row.rate)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-1 py-1 text-right">
                                                            {formatMoney(lineFreight(row))}
                                                        </td>
                                                    </tr>
                                                {(Number(row.advance_paid) > 0 ||
                                                    Number(row.empty_container_charge) > 0 ||
                                                    Number(row.detention) > 0 ||
                                                    Number(row.weightman) > 0 ||
                                                    Number(row.parking) > 0) && (
                                                    <tr>
                                                        <td
                                                            colSpan={9}
                                                            className="px-1 pb-2 pl-4 text-[10px] sm:pl-8"
                                                        >
                                                            {Number(row.advance_paid) > 0 && (
                                                                <span>
                                                                    Advance :{' '}
                                                                    {formatMoney(row.advance_paid ?? 0)}
                                                                </span>
                                                            )}
                                                            {Number(row.empty_container_charge) > 0 && (
                                                                <span className="ml-2 sm:ml-4">
                                                                    EMPTY CONTAINER CHARGE :{' '}
                                                                    {formatMoney(
                                                                        row.empty_container_charge ?? 0,
                                                                    )}
                                                                </span>
                                                            )}
                                                            {Number(row.detention) > 0 && (
                                                                <span className="ml-2 sm:ml-4">
                                                                    DETENTION :{' '}
                                                                    {formatMoney(row.detention ?? 0)}
                                                                </span>
                                                            )}
                                                            {Number(row.weightman) > 0 && (
                                                                <span className="ml-2 sm:ml-4">
                                                                    WEIGHTMAN :{' '}
                                                                    {formatMoney(row.weightman ?? 0)}
                                                                </span>
                                                            )}
                                                            {Number(row.parking) > 0 && (
                                                                <span className="ml-2 sm:ml-4">
                                                                    PARKING :{' '}
                                                                    {formatMoney(row.parking ?? 0)}
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
                            </div>
                        </td>
                    </tr>

                    <SingleRule />

                    <tr>
                        <td colSpan={2} className="py-2">
                            <table className="ml-auto w-full max-w-xs border-collapse">
                                <tbody>
                                    <tr>
                                        <td className="py-0.5 pr-4 text-right">Total Weight</td>
                                        <td className="whitespace-nowrap py-0.5 text-right">
                                            : {Number(invoice.total_weight).toFixed(3)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-0.5 pr-4 text-right">Total Freight</td>
                                        <td className="whitespace-nowrap py-0.5 text-right">
                                            : {formatMoney(invoice.total_freight)}
                                        </td>
                                    </tr>
                                    {Number(invoice.total_empty_container_charge) > 0 && (
                                        <tr>
                                            <td className="py-0.5 pr-4 text-right">
                                                Empty Container Charge
                                            </td>
                                            <td className="whitespace-nowrap py-0.5 text-right">
                                                :{' '}
                                                {formatMoney(invoice.total_empty_container_charge)}
                                            </td>
                                        </tr>
                                    )}
                                    {Number(invoice.total_detention) > 0 && (
                                        <tr>
                                            <td className="py-0.5 pr-4 text-right">Detention</td>
                                            <td className="whitespace-nowrap py-0.5 text-right">
                                                : {formatMoney(invoice.total_detention)}
                                            </td>
                                        </tr>
                                    )}
                                    {Number(invoice.total_weightman) > 0 && (
                                        <tr>
                                            <td className="py-0.5 pr-4 text-right">Weightman</td>
                                            <td className="whitespace-nowrap py-0.5 text-right">
                                                : {formatMoney(invoice.total_weightman)}
                                            </td>
                                        </tr>
                                    )}
                                    {Number(invoice.total_parking) > 0 && (
                                        <tr>
                                            <td className="py-0.5 pr-4 text-right">Parking</td>
                                            <td className="whitespace-nowrap py-0.5 text-right">
                                                : {formatMoney(invoice.total_parking)}
                                            </td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td className="py-0.5 pr-4 text-right">Net Value</td>
                                        <td className="whitespace-nowrap py-0.5 text-right">
                                            : {formatMoney(invoice.net_value)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-0.5 pr-4 text-right">Advance</td>
                                        <td className="whitespace-nowrap py-0.5 text-right">
                                            : {formatMoney(invoice.total_advance)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan={2} className="py-1">
                                            <div className="ml-auto w-40 border-t border-black" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-0.5 pr-4 text-right font-semibold">
                                            Balance
                                        </td>
                                        <td className="whitespace-nowrap py-0.5 text-right font-semibold">
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
                            <td
                                colSpan={2}
                                className="break-words py-3 text-xs font-semibold uppercase sm:text-[inherit]"
                            >
                                {invoice.balance_in_words}
                            </td>
                        </tr>
                    )}

                    <tr>
                        <td colSpan={2} className="break-words py-2">
                            {company.pan && <div>PAN NO. : {company.pan}</div>}
                            {company.gst && <div>GST NO. : {company.gst}</div>}
                            {company.udyam_reg_no && (
                                <div className="break-words">
                                    UDYAM REG NO. : {company.udyam_reg_no}
                                    {company.udyam_date
                                        ? `    DATE : ${formatAppDateTime(company.udyam_date, '')}`
                                        : ''}
                                </div>
                            )}
                            {company.jurisdiction && (
                                <div className="mt-1">{company.jurisdiction}</div>
                            )}
                        </td>
                    </tr>

                    {company.bank_account_no && (
                        <tr>
                            <td colSpan={2} className="break-words pb-3">
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
                        <td colSpan={2} className="py-3">
                            <div className="flex flex-col gap-6 sm:flex-row sm:gap-4">
                                <div className="min-w-0 flex-1">
                                    <div>Gross Freight : {formatMoney(invoice.gross_freight)}</div>
                                    <div>
                                        IGST @ {Number(invoice.igst_rate).toFixed(4)}% :{' '}
                                        {formatMoney(invoice.igst_amount)}
                                    </div>
                                    <div className="mt-2 max-w-xs text-[10px] leading-tight">
                                        TOTAL GST TO BE PAID UNDER REVERSE CHARGE BY RECIPIENT
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1 sm:pl-4">
                                    <div>Prepared By : {invoice.prepared_by ?? ''}</div>
                                    <div className="mt-4 sm:mt-6">
                                        Checked By : {invoice.checked_by ?? ''}
                                    </div>
                                    <div className="mt-6 sm:mt-8">Authorised Signatory</div>
                                </div>
                            </div>
                        </td>
                    </tr>

                    <DoubleRule />

                    <tr>
                        <td
                            colSpan={2}
                            className="break-words py-4 text-center text-sm font-bold"
                        >
                            {company.name}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
