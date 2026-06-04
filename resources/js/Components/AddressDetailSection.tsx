import { DetailGrid, DetailItem } from '@/Components/DetailShow';
import { FormSectionHeader } from '@/Components/FormPage';
import { normalizeCountry } from '@/lib/addressValidation';

type AddressDetailSectionProps = {
    data: Partial<{
        full_address?: string | null;
        city?: string | null;
        taluka?: string | null;
        district?: string | null;
        pincode?: string | null;
        state_code?: string | null;
        country?: string | null;
        address?: string | null;
    }>;
};

function DetailItemLocal({ label, value }: { label: string; value?: string | null }) {
    return <DetailItem label={label} value={value} />;
}

export default function AddressDetailSection({ data }: AddressDetailSectionProps) {
    const fullAddress = data.full_address?.trim() || data.address?.trim();

    if (
        !fullAddress &&
        !data.city?.trim() &&
        !data.taluka?.trim() &&
        !data.district?.trim() &&
        !data.pincode?.trim() &&
        !data.state_code?.trim() &&
        !data.country?.trim()
    ) {
        return null;
    }

    return (
        <>
            <FormSectionHeader title="Address" />
            {fullAddress && (
                <DetailGrid className="mb-4">
                    <DetailItemLocal label="Full Address" value={fullAddress} />
                </DetailGrid>
            )}
            <DetailGrid>
                <DetailItemLocal label="City" value={data.city} />
                <DetailItemLocal label="Taluka" value={data.taluka} />
                <DetailItemLocal label="District" value={data.district} />
                <DetailItemLocal label="Pincode" value={data.pincode} />
                <DetailItemLocal label="State Code" value={data.state_code} />
                <DetailItemLocal label="Country" value={normalizeCountry(data.country)} />
            </DetailGrid>
        </>
    );
}
