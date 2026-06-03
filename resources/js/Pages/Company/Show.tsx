import SavedDocumentsList from '@/Components/SavedDocumentsList';
import { DetailGrid, DetailItem } from '@/Components/DetailShow';
import FormPage, { FormCard, FormSectionHeader } from '@/Components/FormPage';
import { DetailPageHeader, HeaderCreateButton } from '@/Components/ListPageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { usePageHeader } from '@/hooks/usePageHeader';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { formatAppDateTime } from '@/lib/dateUtils';
import type { Company, EntityDocument, ExpenseOption } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

function DetailItemLocal({ label, value }: { label: string; value?: string | null }) {
    return <DetailItem label={label} value={value} />;
}

export default function CompanyShow() {
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [documents, setDocuments] = useState<EntityDocument[]>([]);
    const [documentTypes, setDocumentTypes] = useState<ExpenseOption[]>([]);

    usePageHeader(
        <DetailPageHeader
            title="Company Profile"
            actions={
                <HeaderCreateButton
                    href={route('company.edit')}
                    label={company ? 'Edit Profile' : 'Set Up Profile'}
                    mobileLabel={company ? 'Edit' : 'Set Up'}
                />
            }
        />,
        [company],
    );

    useEffect(() => {
        setLoading(true);

        void appApiPost<
            ApiEnvelope<{
                company: Company | null;
                documents: EntityDocument[];
                document_types: ExpenseOption[];
            }>
        >('/company/company-show', {})
            .then((res) => {
                if (!res.success) {
                    setLoadError(res.message || 'Could not load company.');
                    return;
                }

                setCompany(res.data?.company ?? null);
                setDocuments(res.data?.documents ?? []);
                setDocumentTypes(res.data?.document_types ?? []);
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
                            {company.logo_url && (
                                <div className="mb-4">
                                    <img
                                        src={company.logo_url}
                                        alt="Company logo"
                                        className="h-16 max-w-[12rem] rounded-lg border border-gray-200 bg-gray-50 object-contain"
                                    />
                                </div>
                            )}
                            <DetailGrid cols={3}>
                                <DetailItemLocal label="Company Name" value={company.name} />
                                <DetailItemLocal label="PAN" value={company.pan} />
                                <DetailItemLocal label="GST" value={company.gst} />
                                <DetailItemLocal label="Udyam Reg No" value={company.udyam_reg_no} />
                                <DetailItemLocal
                                    label="Udyam Date"
                                    value={
                                        company.udyam_date
                                            ? formatAppDateTime(company.udyam_date, '')
                                            : null
                                    }
                                />
                                <DetailItemLocal label="Jurisdiction" value={company.jurisdiction} />
                                <DetailItemLocal label="SAC Code" value={company.sac_code} />
                                <DetailItemLocal
                                    label="IGST Rate"
                                    value={
                                        company.igst_rate != null ? `${company.igst_rate}%` : null
                                    }
                                />
                            </DetailGrid>
                            {company.address?.trim() && (
                                <DetailGrid className="mt-4">
                                    <DetailItemLocal label="Address" value={company.address} />
                                </DetailGrid>
                            )}
                        </FormCard>

                        <FormCard>
                            <FormSectionHeader
                                title="Entry Number Settings"
                                description="Consignment entry numbers are auto-generated as PREFIX-SEQUENCE."
                            />
                            <DetailGrid cols={3}>
                                <DetailItemLocal label="Entry Prefix" value={company.entry_number_prefix} />
                                <DetailItemLocal
                                    label="Next Sequence Number"
                                    value={
                                        company.entry_next_sequence != null
                                            ? String(company.entry_next_sequence)
                                            : null
                                    }
                                />
                                <DetailItemLocal label="Next Entry Preview" value={entryPreview} />
                            </DetailGrid>
                        </FormCard>

                        <FormCard>
                            <FormSectionHeader title="Bank Details" />
                            <DetailGrid cols={3}>
                                <DetailItemLocal label="Account Name" value={company.bank_account_name} />
                                <DetailItemLocal label="Account No" value={company.bank_account_no} />
                                <DetailItemLocal label="IFSC" value={company.bank_ifsc} />
                                <DetailItemLocal label="Bank Name" value={company.bank_name} />
                                <DetailItemLocal label="Branch" value={company.bank_branch} />
                            </DetailGrid>
                        </FormCard>

                        {documents.length > 0 && (
                            <FormCard>
                                <SavedDocumentsList
                                    documents={documents}
                                    documentTypes={documentTypes}
                                />
                            </FormCard>
                        )}

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
