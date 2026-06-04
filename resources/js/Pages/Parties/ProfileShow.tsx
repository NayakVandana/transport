import SavedDocumentsList from '@/Components/SavedDocumentsList';
import { DetailGrid, DetailItem, PageToolbar, PageToolbarActions } from '@/Components/DetailShow';
import PageContainer from '@/Components/PageContainer';
import FormPage, { FormCard, FormSectionHeader } from '@/Components/FormPage';
import PrimaryButton from '@/Components/PrimaryButton';
import PageHeaderBar, { HeaderBackLink, InlineBackLink } from '@/Components/PageHeaderBar';
import SecondaryButton from '@/Components/SecondaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { usePageHeader } from '@/hooks/usePageHeader';
import { formatPartyMobiles } from '@/lib/partyValidation';
import type { EntityDocument, ExpenseOption, Party } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { PartyTabs } from './PartyTabs';

function DetailItemLocal({ label, value }: { label: string; value?: string | null }) {
    return <DetailItem label={label} value={value} />;
}

export default function PartyProfileShow({ partyId }: { partyId: number }) {
    const [party, setParty] = useState<Party | null>(null);
    const [documents, setDocuments] = useState<EntityDocument[]>([]);
    const [documentTypes, setDocumentTypes] = useState<ExpenseOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        void appApiPost<
            ApiEnvelope<{
                party: Party;
                documents: EntityDocument[];
                document_types: ExpenseOption[];
            }>
        >('/parties/party-show', { id: partyId })
            .then((res) => {
                if (!res.success || !res.data?.party) {
                    setError(res.message || 'Could not load party.');
                    return;
                }

                setParty(res.data.party);
                setDocuments(res.data.documents ?? []);
                setDocumentTypes(res.data.document_types ?? []);
            })
            .catch(() => {
                setError('Could not load party.');
            })
            .finally(() => setLoading(false));
    }, [partyId]);

    const mobileLabel = party ? formatPartyMobiles(party) : null;

    usePageHeader(
        <PageHeaderBar
            layout="compact"
            title={party?.name ?? 'Party'}
            subtitle={mobileLabel ?? undefined}
            actions={
                <div className="hidden shrink-0 sm:block">
                    <HeaderBackLink href={route('parties.index')} />
                </div>
            }
        />,
        [party?.name, mobileLabel],
    );

    const editHref = `${route('parties.edit', partyId)}?return=profile`;

    return (
        <>
            <Head title={`${party?.name ?? 'Party'} — Profile`} />

            <PageContainer className="space-y-4">
                {error && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {error}
                    </p>
                )}

                {loading && !party ? (
                    <p className="text-center text-sm text-gray-500">Loading party profile…</p>
                ) : party ? (
                    <div className="rounded-lg bg-white shadow">
                        <div className="px-3 pt-2 sm:hidden">
                            <InlineBackLink href={route('parties.index')} />
                        </div>
                        <PartyTabs partyId={partyId} activeTab="profile" />

                        <div className="p-4 sm:p-6">
                            <FormPage size="sm" className="!mx-0 !max-w-none space-y-5">
                                <PageToolbar>
                                    <h3 className="text-lg font-medium text-gray-900">Party Profile</h3>
                                    <PageToolbarActions>
                                        <Link href={editHref}>
                                            <PrimaryButton type="button">Edit Profile</PrimaryButton>
                                        </Link>
                                    </PageToolbarActions>
                                </PageToolbar>

                                <FormCard className="!shadow-none ring-1 ring-gray-200">
                                    <FormSectionHeader title="Basic Details" />
                                    <div className="mb-4 flex items-start gap-4">
                                        {party.logo_url ? (
                                            <img
                                                src={party.logo_url}
                                                alt={`${party.name} logo`}
                                                className="h-20 w-20 rounded-lg border border-gray-200 bg-gray-50 object-contain"
                                            />
                                        ) : null}
                                        <DetailGrid className="flex-1">
                                            <DetailItemLocal label="Party Name" value={party.name} />
                                            <DetailItemLocal
                                                label="Party Owner Name"
                                                value={party.party_owner_name}
                                            />
                                        </DetailGrid>
                                    </div>
                                </FormCard>

                                <FormCard className="!shadow-none ring-1 ring-gray-200">
                                    <FormSectionHeader title="Contact Details" />
                                    <DetailGrid>
                                        <DetailItemLocal label="Email" value={party.email} />
                                        <DetailItemLocal label="Mobile" value={mobileLabel} />
                                    </DetailGrid>
                                </FormCard>

                                <FormCard className="!shadow-none ring-1 ring-gray-200">
                                    <FormSectionHeader title="Tax Details" />
                                    <DetailGrid>
                                        <DetailItemLocal label="PAN No" value={party.pan_no} />
                                        <DetailItemLocal label="GST No" value={party.gst_no} />
                                        <DetailItemLocal
                                            label="International Tax ID"
                                            value={party.international_tax_id}
                                        />
                                    </DetailGrid>
                                </FormCard>

                                <FormCard className="!shadow-none ring-1 ring-gray-200">
                                    <FormSectionHeader title="Address" />
                                    {(party.full_address?.trim() || party.address?.trim()) && (
                                        <DetailGrid className="mb-4">
                                            <DetailItemLocal
                                                label="Full Address"
                                                value={party.full_address ?? party.address}
                                            />
                                        </DetailGrid>
                                    )}
                                    <DetailGrid>
                                        <DetailItemLocal label="City" value={party.city} />
                                        <DetailItemLocal label="Taluka" value={party.taluka} />
                                        <DetailItemLocal label="District" value={party.district} />
                                        <DetailItemLocal label="Pincode" value={party.pincode} />
                                        <DetailItemLocal label="State Code" value={party.state_code} />
                                        <DetailItemLocal label="Country" value={party.country} />
                                    </DetailGrid>
                                </FormCard>

                                {documents.length > 0 && (
                                    <FormCard className="!shadow-none ring-1 ring-gray-200">
                                        <SavedDocumentsList
                                            documents={documents}
                                            documentTypes={documentTypes}
                                        />
                                    </FormCard>
                                )}

                                <div className="flex flex-wrap gap-3">
                                    <Link href={editHref}>
                                        <SecondaryButton type="button">Edit Profile</SecondaryButton>
                                    </Link>
                                </div>
                            </FormPage>
                        </div>
                    </div>
                ) : null}
            </PageContainer>
        </>
    );
}
