import FormPage, { FormCard, FormSectionHeader } from '@/Components/FormPage';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { usePageHeader } from '@/hooks/usePageHeader';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { formatAppDateTime } from '@/lib/dateUtils';
import type { Company } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

function DetailItem({ label, value }: { label: string; value?: string | null }) {
    return (
        <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900">{value?.trim() ? value : '—'}</dd>
        </div>
    );
}

export default function CompanyShow() {
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [company, setCompany] = useState<Company | null>(null);

    usePageHeader(
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <h2 className="text-xl font-semibold text-gray-800">Company Profile</h2>
            <Link href={route('company.edit')}>
                <PrimaryButton type="button">
                    {company ? 'Edit Profile' : 'Set Up Profile'}
                </PrimaryButton>
            </Link>
        </div>,
    );

    useEffect(() => {
        setLoading(true);

        void appApiPost<ApiEnvelope<{ company: Company | null }>>('/company/company-show', {})
            .then((res) => {
                if (!res.success) {
                    setLoadError(res.message || 'Could not load company.');
                    return;
                }

                setCompany(res.data?.company ?? null);
            })
            .catch(() => {
                setLoadError('Could not load company.');
            })
            .finally(() => setLoading(false));
    }, []);

    const entryPreview =
        company?.entry_number_prefix && company.entry_next_sequence != null
            ? `${company.entry_number_prefix}-${company.entry_next_sequence}`
            : null;

    return (
        <>
            <Head title="Company Profile" />

            <FormPage size="lg">
                {loading ? (
                    <p className="py-8 text-center text-sm text-gray-500">Loading…</p>
                ) : loadError ? (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {loadError}
                    </p>
                ) : !company ? (
                    <FormCard>
                        <p className="text-sm text-gray-600">
                            No company profile yet. Add your business details so they appear on tax
                            invoices and consignment entries.
                        </p>
                        <div className="mt-4">
                            <Link href={route('company.edit')}>
                                <PrimaryButton type="button">Set Up Company Profile</PrimaryButton>
                            </Link>
                        </div>
                    </FormCard>
                ) : (
                    <div className="space-y-5">
                        <FormCard>
                            <FormSectionHeader title="Business Details" />
                            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <DetailItem label="Company Name" value={company.name} />
                                <DetailItem label="PAN" value={company.pan} />
                                <DetailItem label="GST" value={company.gst} />
                                <DetailItem label="Udyam Reg No" value={company.udyam_reg_no} />
                                <DetailItem
                                    label="Udyam Date"
                                    value={
                                        company.udyam_date
                                            ? formatAppDateTime(company.udyam_date, '')
                                            : null
                                    }
                                />
                                <DetailItem label="Jurisdiction" value={company.jurisdiction} />
                                <DetailItem label="SAC Code" value={company.sac_code} />
                                <DetailItem
                                    label="IGST Rate"
                                    value={
                                        company.igst_rate != null ? `${company.igst_rate}%` : null
                                    }
                                />
                            </dl>
                            {company.address?.trim() && (
                                <dl className="mt-4">
                                    <DetailItem label="Address" value={company.address} />
                                </dl>
                            )}
                        </FormCard>

                        <FormCard>
                            <FormSectionHeader
                                title="Entry Number Settings"
                                description="Consignment entry numbers are auto-generated as PREFIX-SEQUENCE."
                            />
                            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <DetailItem label="Entry Prefix" value={company.entry_number_prefix} />
                                <DetailItem
                                    label="Next Sequence Number"
                                    value={
                                        company.entry_next_sequence != null
                                            ? String(company.entry_next_sequence)
                                            : null
                                    }
                                />
                                <DetailItem label="Next Entry Preview" value={entryPreview} />
                            </dl>
                        </FormCard>

                        <FormCard>
                            <FormSectionHeader title="Bank Details" />
                            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <DetailItem label="Account Name" value={company.bank_account_name} />
                                <DetailItem label="Account No" value={company.bank_account_no} />
                                <DetailItem label="IFSC" value={company.bank_ifsc} />
                                <DetailItem label="Bank Name" value={company.bank_name} />
                                <DetailItem label="Branch" value={company.bank_branch} />
                            </dl>
                        </FormCard>

                        <div>
                            <Link href={route('company.edit')}>
                                <SecondaryButton type="button">Edit Profile</SecondaryButton>
                            </Link>
                        </div>
                    </div>
                )}
            </FormPage>
        </>
    );
}
