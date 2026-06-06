import AddressDetailSection from '@/Components/AddressDetailSection';
import SavedDocumentsList from '@/Components/SavedDocumentsList';
import { DetailGrid, DetailItem, PageToolbar, PageToolbarActions } from '@/Components/DetailShow';
import PageContainer from '@/Components/PageContainer';
import FormPage, { FormCard, FormSectionHeader } from '@/Components/FormPage';
import PrimaryButton from '@/Components/PrimaryButton';
import PageHeaderBar, { HeaderBackLink, InlineBackLink } from '@/Components/PageHeaderBar';
import SecondaryButton from '@/Components/SecondaryButton';
import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { usePageHeader } from '@/hooks/usePageHeader';
import { formatAppDateTime } from '@/lib/dateUtils';
import { formatDriverMobiles } from '@/lib/driverValidation';
import { formatMoney } from '@/lib/freightCalculator';
import type { Driver, EntityDocument, ExpenseOption } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

function DetailItemLocal({ label, value }: { label: string; value?: string | null }) {
    return <DetailItem label={label} value={value} />;
}

export default function DriverShow({ driverId }: { driverId: number }) {
    const [driver, setDriver] = useState<Driver | null>(null);
    const [documents, setDocuments] = useState<EntityDocument[]>([]);
    const [documentTypes, setDocumentTypes] = useState<ExpenseOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        void appApiPost<
            ApiEnvelope<{
                driver: Driver;
                document_types: ExpenseOption[];
            }>
        >('/drivers/driver-show', { id: driverId })
            .then((res) => {
                if (!res.success || !res.data?.driver) {
                    setError(res.message || 'Could not load driver.');
                    return;
                }

                setDriver(res.data.driver);
                setDocuments(res.data.driver.documents ?? []);
                setDocumentTypes(res.data.document_types ?? []);
            })
            .catch(() => {
                setError('Could not load driver.');
            })
            .finally(() => setLoading(false));
    }, [driverId]);

    const mobileLabel = driver ? formatDriverMobiles(driver) : null;
    const showPhoto = driver?.show_photo !== false;
    const showEmail = driver?.show_email !== false;
    const showAddress = driver?.show_address !== false;

    usePageHeader(
        <PageHeaderBar
            layout="compact"
            title={driver?.name ?? 'Driver'}
            subtitle={mobileLabel || undefined}
            actions={
                <div className="hidden shrink-0 sm:block">
                    <HeaderBackLink href={route('drivers.index')} />
                </div>
            }
        />,
        [driver?.name, mobileLabel],
    );

    const editHref = `${route('drivers.edit', driverId)}?return=profile`;

    return (
        <>
            <Head title={`${driver?.name ?? 'Driver'} — Profile`} />

            <PageContainer className="space-y-4">
                {error && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {error}
                    </p>
                )}

                {loading && !driver ? (
                    <p className="text-center text-sm text-gray-500">Loading driver profile…</p>
                ) : driver ? (
                    <div className="rounded-lg bg-white shadow">
                        <div className="px-3 pt-2 sm:hidden">
                            <InlineBackLink href={route('drivers.index')} />
                        </div>

                        <div className="p-4 sm:p-6">
                            <FormPage size="md" className="!mx-0 !max-w-none space-y-5">
                                <PageToolbar>
                                    <h3 className="text-lg font-medium text-gray-900">Driver Profile</h3>
                                    <PageToolbarActions>
                                        <Link href={editHref}>
                                            <PrimaryButton type="button">Edit Profile</PrimaryButton>
                                        </Link>
                                    </PageToolbarActions>
                                </PageToolbar>

                                <FormCard className="!shadow-none ring-1 ring-gray-200">
                                    <FormSectionHeader title="Basic Details" />
                                    <div className="mb-4 flex items-start gap-4">
                                        {showPhoto && driver.photo_url ? (
                                            <img
                                                src={driver.photo_url}
                                                alt={`${driver.name} photo`}
                                                className="h-20 w-20 rounded-lg border border-gray-200 bg-gray-50 object-contain"
                                            />
                                        ) : null}
                                        <DetailGrid className="flex-1">
                                            <DetailItemLocal label="Name" value={driver.name} />
                                            <DetailItemLocal
                                                label="Status"
                                                value={driver.status === 'active' ? 'Active' : 'Inactive'}
                                            />
                                            <DetailItemLocal
                                                label="Joining Date"
                                                value={formatAppDateTime(driver.joining_date)}
                                            />
                                            <DetailItemLocal
                                                label="Salary"
                                                value={
                                                    driver.salary != null && driver.salary !== ''
                                                        ? `₹ ${formatMoney(driver.salary)}`
                                                        : null
                                                }
                                            />
                                        </DetailGrid>
                                    </div>
                                </FormCard>

                                <FormCard className="!shadow-none ring-1 ring-gray-200">
                                    <FormSectionHeader title="Contact Details" />
                                    <DetailGrid>
                                        {showEmail && (
                                            <DetailItemLocal label="Email" value={driver.email} />
                                        )}
                                        <DetailItemLocal label="Mobile" value={mobileLabel} />
                                    </DetailGrid>
                                </FormCard>

                                <FormCard className="!shadow-none ring-1 ring-gray-200">
                                    <FormSectionHeader title="Identity Details" />
                                    <DetailGrid>
                                        <DetailItemLocal label="Aadhaar No" value={driver.aadhaar_no} />
                                        <DetailItemLocal label="PAN No" value={driver.pan_no} />
                                    </DetailGrid>
                                </FormCard>

                                <FormCard className="!shadow-none ring-1 ring-gray-200">
                                    <FormSectionHeader title="License" />
                                    <DetailGrid>
                                        <DetailItemLocal
                                            label="License Number"
                                            value={driver.license_number}
                                        />
                                        <DetailItemLocal
                                            label="License Expiry"
                                            value={formatAppDateTime(driver.license_expiry)}
                                        />
                                    </DetailGrid>
                                </FormCard>

                                {showAddress && (
                                    <FormCard className="!shadow-none ring-1 ring-gray-200">
                                        <AddressDetailSection data={driver} />
                                    </FormCard>
                                )}

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
