import PageContainer from '@/Components/PageContainer';
import FormPage, { FormCard, FormSectionHeader } from '@/Components/FormPage';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { usePageHeader } from '@/hooks/usePageHeader';
import type { Party } from '@/types/transport';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { PartyTabs } from './PartyTabs';

function DetailItem({ label, value }: { label: string; value?: string | null }) {
    return (
        <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900">{value?.trim() ? value : '—'}</dd>
        </div>
    );
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
        <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
                <h2 className="text-xl font-semibold text-gray-800">{party?.name ?? 'Party'}</h2>
                {party?.mobile && <p className="text-sm text-gray-500">{party.mobile}</p>}
            </div>
            <Link href={route('parties.index')}>
                <SecondaryButton type="button">Back to Party</SecondaryButton>
            </Link>
        </div>,
        [party?.name, party?.mobile],
    );

    const destroyParty = async () => {
        if (!confirm('Delete this party?')) {
            return;
        }

        const res = await appApiPost<ApiEnvelope<null>>('/parties/party-destroy', { id: partyId });

        if (!res.success) {
            setError(res.message || 'Could not delete party.');
            return;
        }

        router.visit(route('parties.index'));
    };

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
                        <PartyTabs partyId={partyId} activeTab="profile" />

                        <div className="p-4 sm:p-6">
                            <FormPage size="sm" className="!mx-0 !max-w-none space-y-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-lg font-medium text-gray-900">Party Profile</h3>
                                    <Link href={editHref}>
                                        <PrimaryButton type="button">Edit Profile</PrimaryButton>
                                    </Link>
                                </div>

                                <FormCard className="!shadow-none ring-1 ring-gray-200">
                                    <FormSectionHeader title="Contact Details" />
                                    <dl className="grid gap-4 sm:grid-cols-2">
                                        <DetailItem label="Name" value={party.name} />
                                        <DetailItem label="Mobile" value={party.mobile} />
                                        <DetailItem label="State Code" value={party.state_code} />
                                    </dl>
                                    {party.address?.trim() && (
                                        <dl className="mt-4">
                                            <DetailItem label="Address" value={party.address} />
                                        </dl>
                                    )}
                                </FormCard>

                                <div className="flex flex-wrap gap-3">
                                    <Link href={editHref}>
                                        <SecondaryButton type="button">Edit Profile</SecondaryButton>
                                    </Link>
                                    <SecondaryButton type="button" onClick={() => void destroyParty()}>
                                        Delete Party
                                    </SecondaryButton>
                                </div>
                            </FormPage>
                        </div>
                    </div>
                ) : null}
            </PageContainer>
        </>
    );
}
