import { DetailGrid, DetailItem, PageToolbar, PageToolbarActions } from '@/Components/DetailShow';
import PageContainer from '@/Components/PageContainer';
import FormPage, { FormCard, FormSectionHeader } from '@/Components/FormPage';
import PrimaryButton from '@/Components/PrimaryButton';
import PageHeaderBar, { HeaderBackLink, InlineBackLink } from '@/Components/PageHeaderBar';
import SecondaryButton from '@/Components/SecondaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { usePageHeader } from '@/hooks/usePageHeader';
import type { Party } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { PartyTabs } from './PartyTabs';

function DetailItemLocal({ label, value }: { label: string; value?: string | null }) {
    return <DetailItem label={label} value={value} />;
}

export default function PartyProfileShow({ partyId }: { partyId: number }) {
    const [party, setParty] = useState<Party | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        void appApiPost<ApiEnvelope<{ party: Party }>>('/parties/party-show', { id: partyId })
            .then((res) => {
                if (!res.success || !res.data?.party) {
                    setError(res.message || 'Could not load party.');
                    return;
                }

                setParty(res.data.party);
            })
            .catch(() => {
                setError('Could not load party.');
            })
            .finally(() => setLoading(false));
    }, [partyId]);

    usePageHeader(
        <PageHeaderBar
            title={party?.name ?? 'Party'}
            subtitle={party?.mobile}
            actions={
                <div className="hidden shrink-0 sm:block">
                    <HeaderBackLink href={route('parties.index')} />
                </div>
            }
        />,
        [party?.name, party?.mobile],
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
                                    <FormSectionHeader title="Contact Details" />
                                    <DetailGrid>
                                        <DetailItemLocal label="Name" value={party.name} />
                                        <DetailItemLocal label="Mobile" value={party.mobile} />
                                        <DetailItemLocal label="State Code" value={party.state_code} />
                                    </DetailGrid>
                                    {party.address?.trim() && (
                                        <DetailGrid className="mt-4">
                                            <DetailItemLocal label="Address" value={party.address} />
                                        </DetailGrid>
                                    )}
                                </FormCard>

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
