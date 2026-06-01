import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { formatAppDateTime } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/freightCalculator';
import type { FreightInvoice } from '@/types/transport';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';

function line(char: string, len = 80): string {
    return char.repeat(len);
}

export default function InvoicePrint({ invoiceId }: { invoiceId: number }) {
    const [invoice, setInvoice] = useState<FreightInvoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);

        void appApiPost<ApiEnvelope<{ invoice: FreightInvoice }>>('/invoices/invoice-show', {
            id: invoiceId,
        })
            .then((res) => {
                if (!res.success || !res.data?.invoice) {
                    setError(res.message || 'Could not load invoice.');
                    return;
                }

                setInvoice(res.data.invoice);
            })
            .catch(() => {
                setError('Could not load invoice.');
            })
            .finally(() => setLoading(false));
    }, [invoiceId]);

    if (loading) {
        return <p className="p-8 text-center text-sm text-gray-500">Loading invoice…</p>;
    }

    if (error || !invoice) {
        return (
            <p className="m-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error ?? 'Invoice not found.'}
            </p>
        );
    }

    const company = invoice.company!;
    const party = invoice.party!;
    const lines = invoice.lines ?? [];

    return (
        <>
            <Head title={`Print ${invoice.bill_number}`} />
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { margin: 0; }
                }
            `}</style>

            <div className="no-print border-b bg-gray-100 px-4 py-3 text-center">
                <button
                    type="button"
                    onClick={() => window.print()}
                    className="rounded bg-indigo-600 px-4 py-2 text-sm text-white"
                >
                    Print Invoice
                </button>
            </div>

            <div className="overflow-x-auto">
                <pre
                    className="mx-auto min-w-[min(100%,640px)] max-w-[210mm] whitespace-pre bg-white p-4 font-mono text-[10px] leading-tight text-black sm:p-8 sm:text-xs"
                    style={{ fontFamily: 'Courier New, Courier, monospace' }}
                >
                {line('=', 80)}
                {'\n'}
                {'TAX INVOICE'.padStart(48)}
                {'\n'}
                {line('=', 80)}
                {'\n\n'}
                {'To,'.padEnd(40)}
                {`Bill No. : ${invoice.bill_number}`}
                {'\n'}
                {party.name.padEnd(40)}
                {`Date     : ${formatAppDateTime(invoice.invoice_date, '')}`}
                {'\n'}
                {(party.address ?? '').split('\n').map((addrLine, i) => (
                    <span key={i}>
                        {i === 0 ? addrLine.padEnd(40) : addrLine}
                        {i === 0 ? `SAC Code : ${invoice.sac_code}` : ''}
                        {'\n'}
                    </span>
                ))}
                {party.mobile ? `Mob: ${party.mobile}` : ''}
                {'\n\n'}
                {line('-', 80)}
                {'\n'}
                {'Being The Amount Of Freight Charges For The Transportation Of Your Consignment.'.padStart(
                    56,
                )}
                {'\n'}
                {line('-', 80)}
                {'\n\n'}
                {[
                    'Srl',
                    'Entry No.',
                    'Date',
                    'Vehicle',
                    'From',
                    'Product Name',
                    'Weight',
                    'Rate',
                    'Freight',
                ].join('  ')}
                {'\n'}
                {line('-', 80)}
                {'\n'}
                {lines.map((row, i) => (
                    <span key={row.id ?? i}>
                        {String(i + 1).padStart(3)}
                        {'  '}
                        {(row.entry_number ?? '').padEnd(12)}
                        {formatAppDateTime(row.entry_date, '').padEnd(16)}
                        {(row.vehicle_number ?? '').padEnd(12)}
                        {(row.route_from ?? '').substring(0, 18).padEnd(20)}
                        {(row.product_name ?? '').substring(0, 14).padEnd(16)}
                        {Number(row.weight).toFixed(3).padStart(7)}
                        {formatMoney(row.rate).padStart(10)}
                        {formatMoney(row.freight ?? Number(row.weight) * Number(row.rate)).padStart(
                            12,
                        )}
                        {'\n'}
                        {(Number(row.advance_paid) > 0 ||
                            Number(row.empty_container_charge) > 0) && (
                            <>
                                {'     '}
                                {Number(row.advance_paid) > 0 &&
                                    `Advance : ${formatMoney(row.advance_paid ?? 0)}`}
                                {Number(row.empty_container_charge) > 0 &&
                                    `    EMPTY CONTAINER CHARGE : ${formatMoney(row.empty_container_charge ?? 0)}`}
                                {'\n'}
                            </>
                        )}
                    </span>
                ))}
                {line('-', 80)}
                {'\n'}
                {''.padEnd(52)}
                {`Total Weight : ${Number(invoice.total_weight).toFixed(3)}`.padStart(28)}
                {'\n'}
                {''.padEnd(52)}
                {`Total Freight : ${formatMoney(invoice.total_freight)}`.padStart(28)}
                {'\n'}
                {Number(invoice.total_empty_container_charge) > 0 && (
                    <>
                        {''.padEnd(52)}
                        {`Empty Container Charge : ${formatMoney(invoice.total_empty_container_charge)}`.padStart(
                            28,
                        )}
                        {'\n'}
                    </>
                )}
                {''.padEnd(52)}
                {`Net Value : ${formatMoney(invoice.net_value)}`.padStart(28)}
                {'\n'}
                {''.padEnd(52)}
                {`Advance : ${formatMoney(invoice.total_advance)}`.padStart(28)}
                {'\n'}
                {line('-', 40).padStart(52)}
                {'\n'}
                {''.padEnd(52)}
                {`Balance : ${formatMoney(invoice.balance_amount)}`.padStart(28)}
                {'\n'}
                {line('=', 80)}
                {'\n\n'}
                {invoice.balance_in_words}
                {'\n\n'}
                {company.pan ? `PAN NO. : ${company.pan}` : ''}
                {'  '}
                {company.gst ? `GST NO. : ${company.gst}` : ''}
                {'\n'}
                {company.udyam_reg_no
                    ? `UDYAM REG NO. : ${company.udyam_reg_no}${
                          company.udyam_date
                              ? `  DATE : ${formatAppDateTime(company.udyam_date, '')}`
                              : ''
                      }`
                    : ''}
                {'\n'}
                {company.jurisdiction ?? ''}
                {'\n\n'}
                {company.bank_account_no && (
                    <>
                        {`A/C NO. : ${company.bank_account_no}`}
                        {company.bank_ifsc ? `    IFSC : ${company.bank_ifsc}` : ''}
                        {'\n'}
                        {company.bank_name}
                        {company.bank_branch ? ` - ${company.bank_branch}` : ''}
                        {'\n\n'}
                    </>
                )}
                {line('-', 40)}
                {'\n'}
                {`Gross Freight : ${formatMoney(invoice.gross_freight)}`.padEnd(40)}
                {`Prepared By : ${invoice.prepared_by ?? ''}`}
                {'\n'}
                {`IGST @ ${Number(invoice.igst_rate).toFixed(4)}% : ${formatMoney(invoice.igst_amount)}`.padEnd(
                    40,
                )}
                {`Checked By : ${invoice.checked_by ?? ''}`}
                {'\n'}
                {'TOTAL GST TO BE PAID UNDER REVERSE CHARGE BY RECIPIENT'.padEnd(40)}
                {'Authorised Signatory'}
                {'\n'}
                {line('=', 80)}
                {'\n\n'}
                {company.name.padStart(40 + Math.floor(company.name.length / 2))}
                </pre>
            </div>
        </>
    );
}
