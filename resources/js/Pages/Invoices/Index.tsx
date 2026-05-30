import ListExportButtons from '@/Components/ListExportButtons';
import ListFilterBar from '@/Components/ListFilterBar';
import PrimaryButton from '@/Components/PrimaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { defaultDateFilters, useFilteredList } from '@/hooks/useFilteredList';
import { usePageHeader } from '@/hooks/usePageHeader';
import { exportFilteredList } from '@/lib/listExport';
import { buildListFilterParams, type ListFilters } from '@/lib/listFilters';
import { formatMoney } from '@/lib/freightCalculator';
import type { FreightInvoice, Party } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

type InvoiceFilters = ListFilters & {
    status?: string;
    party_id?: string;
};

type InvoicesListData = {
    invoices: { data: (FreightInvoice & { party?: { name: string } })[] };
    parties: Pick<Party, 'id' | 'name'>[];
    filters: InvoiceFilters;
    filterSummary: string;
};

const defaultFilters: InvoiceFilters = {
    search: '',
    status: '',
    party_id: '',
    ...defaultDateFilters,
};

export default function InvoicesIndex() {
    const [actionError, setActionError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');

    usePageHeader(
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Tax Invoices</h2>
            <Link href={route('invoices.create')}>
                <PrimaryButton>New Invoice</PrimaryButton>
            </Link>
        </div>,
    );

    const {
        data,
        filters,
        filterSummary,
        dateValue,
        loading,
        error,
        hasActiveFilters,
        applyDateChange,
        applySearch,
        updateField,
        clearFilters,
    } = useFilteredList<InvoicesListData, InvoiceFilters>({
        defaultFilters,
        extraFilterKeys: ['status', 'party_id'],
        load: async (activeFilters) => {
            const res = await appApiPost<ApiEnvelope<InvoicesListData>>(
                '/invoices/invoices-list',
                buildListFilterParams(activeFilters),
            );

            return {
                success: res.success,
                data: res.data,
                message: res.message,
                filters: res.data?.filters,
                filterSummary: res.data?.filterSummary,
            };
        },
    });

    const invoices = data?.invoices.data ?? [];
    const displayError = actionError ?? error;

    const exportFiltered = async (type: 'csv' | 'pdf') => {
        try {
            setActionError(null);
            await exportFilteredList('invoices', type, { ...filters, search: searchInput });
        } catch {
            setActionError(`Could not export ${type.toUpperCase()}.`);
        }
    };

    return (
        <>
            <Head title="Invoices" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-4 sm:px-6 lg:px-8">
                    {displayError && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {displayError}
                        </p>
                    )}

                    <ListFilterBar
                        dateValue={dateValue}
                        onDateChange={applyDateChange}
                        search={{
                            value: searchInput,
                            placeholder: 'Search bill number…',
                            onChange: setSearchInput,
                            onSubmit: () => applySearch(searchInput),
                        }}
                        selects={[
                            {
                                name: 'status',
                                label: 'Status',
                                value: filters.status ?? '',
                                options: [
                                    { value: 'draft', label: 'Draft' },
                                    { value: 'finalized', label: 'Finalized' },
                                ],
                                onChange: (value) => updateField('status', value),
                            },
                            {
                                name: 'party_id',
                                label: 'Party',
                                value: filters.party_id ?? '',
                                widthClass: 'w-[10rem]',
                                options: (data?.parties ?? []).map((p) => ({
                                    value: String(p.id),
                                    label: p.name,
                                })),
                                onChange: (value) => updateField('party_id', value),
                            },
                        ]}
                        filterSummary={filterSummary}
                        hasActiveFilters={hasActiveFilters}
                        onClear={() => {
                            setSearchInput('');
                            clearFilters();
                        }}
                        actions={
                            <ListExportButtons onExport={(type) => void exportFiltered(type)} />
                        }
                    />

                    {loading && !data ? (
                        <p className="text-center text-sm text-gray-500">Loading invoices…</p>
                    ) : (
                        <div className="overflow-hidden rounded-lg bg-white shadow">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-medium text-gray-500">Bill No</th>
                                        <th className="px-6 py-3 text-left font-medium text-gray-500">Party</th>
                                        <th className="px-6 py-3 text-left font-medium text-gray-500">Date</th>
                                        <th className="px-6 py-3 text-right font-medium text-gray-500">Balance</th>
                                        <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {invoices.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                {hasActiveFilters
                                                    ? 'No invoices match your filters.'
                                                    : 'No invoices yet.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        invoices.map((inv) => (
                                            <tr key={inv.id}>
                                                <td className="px-6 py-3 font-medium">{inv.bill_number}</td>
                                                <td className="px-6 py-3">{inv.party?.name}</td>
                                                <td className="px-6 py-3">{inv.invoice_date}</td>
                                                <td className="px-6 py-3 text-right">
                                                    ₹ {formatMoney(inv.balance_amount)}
                                                </td>
                                                <td className="space-x-2 px-6 py-3 text-right">
                                                    <Link
                                                        href={route('invoices.show', inv.id)}
                                                        className="text-indigo-600 hover:underline"
                                                    >
                                                        View
                                                    </Link>
                                                    <Link
                                                        href={route('invoices.print', inv.id)}
                                                        className="text-gray-600 hover:underline"
                                                        target="_blank"
                                                    >
                                                        Print
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
