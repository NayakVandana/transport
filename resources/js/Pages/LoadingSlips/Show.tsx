import PageContainer from '@/Components/PageContainer';
import { FormPageHeader } from '@/Components/ListPageHeader';
import PartyLink from '@/Components/PartyLink';
import SecondaryButton from '@/Components/SecondaryButton';
import { usePageHeader } from '@/hooks/usePageHeader';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { downloadLoadingSlipPdf } from '@/lib/loadingSlipPdf';
import type { Company, LoadingSlip } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

function formatSlipDate(value?: string | null): string {
    if (!value) return '—';
    const [year, month, day] = value.slice(0, 10).split('-');
    return year && month && day ? `${day}-${month}-${year}` : value;
}

function formatSlipAmount(value: number | string): string {
    return Math.round(Number(value) || 0).toLocaleString('en-IN');
}

export default function LoadingSlipShow({ loadingSlipId }: { loadingSlipId: number }) {
    const [slip, setSlip] = useState<LoadingSlip | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [contactEmail, setContactEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);

    usePageHeader(<FormPageHeader title="Loading Slip" backHref={route('loading-slips.index')} />);

    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await appApiPost<ApiEnvelope<{ loadingSlip: LoadingSlip; company: Company | null; contactEmail: string }>>('/loading-slips/loading-slip-show', { id: loadingSlipId });
            if (!res.success || !res.data?.loadingSlip) { setError(res.message || 'Could not load loading slip.'); return; }
            setSlip(res.data.loadingSlip);
            setCompany(res.data.company ?? null);
            setContactEmail(res.data.contactEmail ?? '');
        } catch { setError('Could not load loading slip.'); } finally { setLoading(false); }
    };

    useEffect(() => { void refresh(); }, [loadingSlipId]);

    const handleDownload = async () => {
        if (!slip) return;
        setDownloading(true);
        setActionError(null);
        try { await downloadLoadingSlipPdf(slip.id, slip.slip_date.slice(0, 10)); }
        catch { setActionError('Could not download PDF.'); } finally { setDownloading(false); }
    };

    const lines = slip?.lines ?? [];
    const officeAddress = company?.full_address ?? company?.address ?? '';

    return (
        <>
            <Head title="Loading Slip" />
            <PageContainer className="space-y-4">
                {(actionError ?? error) && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionError ?? error}</p>}

                {loading && !slip ? <p className="text-center text-sm text-gray-500">Loading…</p> : slip ? (
                    <>
                        <div className="flex flex-wrap items-center gap-3">
                            <SecondaryButton type="button" onClick={() => void handleDownload()} disabled={downloading}>{downloading ? 'Downloading…' : 'Download PDF'}</SecondaryButton>
                            {slip.status === 'draft' && (
                                <Link href={route('loading-slips.edit', slip.id)}><SecondaryButton type="button">Edit</SecondaryButton></Link>
                            )}
                            {slip.freight_invoice && (
                                <Link href={route('invoices.show', slip.freight_invoice.id)} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                                    View invoice {slip.freight_invoice.bill_number}
                                </Link>
                            )}
                        </div>

                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 px-6 py-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        {company?.logo_url && <img src={company.logo_url} alt="" className="mb-2 max-h-14 max-w-[120px] object-contain" />}
                                        <h2 className="text-xl font-bold text-blue-900">{company?.name ?? '—'}</h2>
                                    </div>
                                    <div className="text-right">
                                        <h1 className="text-2xl font-bold tracking-wide text-blue-700">LOADING SLIP</h1>
                                        <div className="mt-2 inline-block border border-gray-300 text-left text-sm">
                                            <div className="grid grid-cols-2 border-b border-gray-300"><span className="border-r border-gray-300 px-3 py-1 font-semibold">DATE</span><span className="px-3 py-1">{formatSlipDate(slip.slip_date)}</span></div>
                                            <div className="grid grid-cols-2"><span className="border-r border-gray-300 px-3 py-1 font-semibold">Loading date</span><span className="px-3 py-1">{formatSlipDate(slip.loading_date)}</span></div>
                                        </div>
                                    </div>
                                </div>
                                {officeAddress && <p className="mt-4 whitespace-pre-line text-center text-sm text-gray-700">{officeAddress}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div>
                                    <div className="bg-blue-900 px-4 py-2 text-sm font-bold uppercase text-white">FROM: {slip.route_from?.toUpperCase() || '—'}</div>
                                    <p className="px-4 py-3 text-sm">M/S: {slip.party ? <PartyLink partyId={slip.party.id} name={slip.party.name} className="font-medium uppercase" /> : '—'}</p>
                                </div>
                                <div>
                                    <div className="bg-blue-900 px-4 py-2 text-sm font-bold uppercase text-white">TO: {slip.route_to?.toUpperCase() || '—'}</div>
                                    {contactEmail && <p className="px-4 py-3 text-sm">E-Mail : {contactEmail}</p>}
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full border-collapse text-sm">
                                    <thead><tr className="bg-blue-900 text-white">
                                        <th className="border border-blue-900 px-3 py-2">Sr No</th>
                                        <th className="border border-blue-900 px-3 py-2">Vehicle No</th>
                                        <th className="border border-blue-900 px-3 py-2">Destination</th>
                                        <th className="border border-blue-900 px-3 py-2 text-right">Freight rate</th>
                                        <th className="border border-blue-900 px-3 py-2 text-right">Advance</th>
                                        <th className="border border-blue-900 px-3 py-2 text-right">Balance</th>
                                    </tr></thead>
                                    <tbody>
                                        {lines.map((line) => (
                                            <tr key={line.id ?? line.serial_number} className="text-center">
                                                <td className="border border-gray-300 px-3 py-2">{line.serial_number}</td>
                                                <td className="border border-gray-300 px-3 py-2">{line.vehicle_number ?? '—'}</td>
                                                <td className="border border-gray-300 px-3 py-2 uppercase">{line.destination ?? '—'}</td>
                                                <td className="border border-gray-300 px-3 py-2 text-right">{formatSlipAmount(line.freight_rate)}</td>
                                                <td className="border border-gray-300 px-3 py-2 text-right">{formatSlipAmount(line.advance)}</td>
                                                <td className="border border-gray-300 px-3 py-2 text-right">{formatSlipAmount(line.balance)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {lines.length > 0 && (
                                        <tfoot><tr className="bg-gray-50 font-semibold">
                                            <td colSpan={3} className="border border-gray-300 px-3 py-2 text-right">TOTAL</td>
                                            <td className="border border-gray-300 px-3 py-2 text-right">{formatSlipAmount(slip.total_freight)}</td>
                                            <td className="border border-gray-300 px-3 py-2 text-right">{formatSlipAmount(slip.total_advance)}</td>
                                            <td className="border border-gray-300 px-3 py-2 text-right">{formatSlipAmount(slip.total_balance)}</td>
                                        </tr></tfoot>
                                    )}
                                </table>
                            </div>

                            <div className="grid grid-cols-1 gap-6 px-6 py-5 md:grid-cols-2">
                                <div className="max-w-xs">
                                    <table className="w-full border-collapse text-sm">
                                        <tbody>
                                            <tr><td className="border border-gray-300 bg-emerald-100 px-3 py-2 font-bold">TOTAL FREIGHT</td><td className="border border-gray-300 bg-yellow-200 px-3 py-2 text-right font-bold">{formatSlipAmount(slip.total_freight)}</td></tr>
                                            <tr><td className="border border-gray-300 bg-emerald-100 px-3 py-2 font-bold">TOTAL ADVANCE</td><td className="border border-gray-300 bg-yellow-200 px-3 py-2 text-right font-bold">{formatSlipAmount(slip.total_advance)}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">AUTHORISED SIGN</p>
                                    <p className="mt-8 uppercase">{slip.authorized_signatory || '—'}</p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : null}
            </PageContainer>
        </>
    );
}
