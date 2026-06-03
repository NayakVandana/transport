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
import type { EntityDocument, ExpenseOption, Vehicle } from '@/types/transport';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

function DetailItemLocal({ label, value }: { label: string; value?: string | null }) {
    return <DetailItem label={label} value={value} />;
}

export default function VehicleShow({ vehicleId }: { vehicleId: number }) {
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [documents, setDocuments] = useState<EntityDocument[]>([]);
    const [documentTypes, setDocumentTypes] = useState<ExpenseOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        void appApiPost<
            ApiEnvelope<{
                vehicle: Vehicle;
                document_types: ExpenseOption[];
            }>
        >('/vehicles/vehicle-show', { id: vehicleId })
            .then((res) => {
                if (!res.success || !res.data?.vehicle) {
                    setError(res.message || 'Could not load vehicle.');
                    return;
                }

                setVehicle(res.data.vehicle);
                setDocuments(res.data.vehicle.documents ?? []);
                setDocumentTypes(res.data.document_types ?? []);
            })
            .catch(() => {
                setError('Could not load vehicle.');
            })
            .finally(() => setLoading(false));
    }, [vehicleId]);

    usePageHeader(
        <PageHeaderBar
            layout="compact"
            title={vehicle?.vehicle_number ?? 'Vehicle'}
            subtitle={
                vehicle
                    ? [vehicle.vehicle_type, vehicle.brand, vehicle.model].filter(Boolean).join(' · ')
                    : undefined
            }
            actions={
                <div className="hidden shrink-0 sm:block">
                    <HeaderBackLink href={route('vehicles.index')} />
                </div>
            }
        />,
        [vehicle?.vehicle_number, vehicle?.vehicle_type, vehicle?.brand, vehicle?.model],
    );

    const editHref = `${route('vehicles.edit', vehicleId)}?return=profile`;

    return (
        <>
            <Head title={`${vehicle?.vehicle_number ?? 'Vehicle'} — Profile`} />

            <PageContainer className="space-y-4">
                {error && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {error}
                    </p>
                )}

                {loading && !vehicle ? (
                    <p className="text-center text-sm text-gray-500">Loading vehicle profile…</p>
                ) : vehicle ? (
                    <div className="rounded-lg bg-white shadow">
                        <div className="px-3 pt-2 sm:hidden">
                            <InlineBackLink href={route('vehicles.index')} />
                        </div>

                        <div className="p-4 sm:p-6">
                            <FormPage size="lg" className="!mx-0 !max-w-none space-y-5">
                                <PageToolbar>
                                    <h3 className="text-lg font-medium text-gray-900">Vehicle Profile</h3>
                                    <PageToolbarActions>
                                        <Link href={editHref}>
                                            <PrimaryButton type="button">Edit Profile</PrimaryButton>
                                        </Link>
                                    </PageToolbarActions>
                                </PageToolbar>

                                <FormCard className="!shadow-none ring-1 ring-gray-200">
                                    <FormSectionHeader title="Vehicle Details" />
                                    <DetailGrid cols={3}>
                                        <DetailItemLocal
                                            label="Vehicle Number"
                                            value={vehicle.vehicle_number}
                                        />
                                        <DetailItemLocal label="Type" value={vehicle.vehicle_type} />
                                        <DetailItemLocal label="Brand" value={vehicle.brand} />
                                        <DetailItemLocal label="Model" value={vehicle.model} />
                                        <DetailItemLocal label="Capacity" value={vehicle.capacity} />
                                        <DetailItemLocal label="Fuel Type" value={vehicle.fuel_type} />
                                        <DetailItemLocal
                                            label="Status"
                                            value={vehicle.status === 'active' ? 'Active' : 'Inactive'}
                                        />
                                    </DetailGrid>
                                </FormCard>

                                <FormCard className="!shadow-none ring-1 ring-gray-200">
                                    <FormSectionHeader title="Insurance & Permits" />
                                    <DetailGrid cols={3}>
                                        <DetailItemLocal
                                            label="Insurance Number"
                                            value={vehicle.insurance_number}
                                        />
                                        <DetailItemLocal
                                            label="Insurance Expiry"
                                            value={formatAppDateTime(vehicle.insurance_expiry)}
                                        />
                                        <DetailItemLocal
                                            label="Permit Number"
                                            value={vehicle.permit_number}
                                        />
                                        <DetailItemLocal
                                            label="Permit Expiry"
                                            value={formatAppDateTime(vehicle.permit_expiry)}
                                        />
                                        <DetailItemLocal
                                            label="Pollution Expiry"
                                            value={formatAppDateTime(vehicle.pollution_expiry)}
                                        />
                                        <DetailItemLocal
                                            label="Fitness Expiry"
                                            value={formatAppDateTime(vehicle.fitness_expiry)}
                                        />
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
