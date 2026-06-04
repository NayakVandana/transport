import { appApiPost, type ApiEnvelope } from '@/api/appClient';
import { useEffect, useState } from 'react';

export type AddressLocalityLevel = 'state' | 'district' | 'taluka' | 'city' | 'pincode';

export type AddressLocalityOption = { value: string; label: string };

type Filters = {
    level: AddressLocalityLevel;
    state_code?: string;
    district?: string;
    taluka?: string;
    city?: string;
};

export function useAddressLocalityOptions(filters: Filters, enabled = true) {
    const [options, setOptions] = useState<AddressLocalityOption[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!enabled) {
            setOptions([]);
            return;
        }

        if (filters.level !== 'state' && !filters.state_code) {
            setOptions([]);
            return;
        }

        if (filters.level === 'taluka' && !filters.district) {
            setOptions([]);
            return;
        }

        if (filters.level === 'city' && (!filters.district || !filters.taluka)) {
            setOptions([]);
            return;
        }

        if (filters.level === 'pincode' && (!filters.district || !filters.taluka || !filters.city)) {
            setOptions([]);
            return;
        }

        let cancelled = false;
        setLoading(true);

        void appApiPost<ApiEnvelope<{ options: AddressLocalityOption[] }>>(
            '/address/address-locality-options',
            {
                level: filters.level,
                state_code: filters.state_code || undefined,
                district: filters.district || undefined,
                taluka: filters.taluka || undefined,
                city: filters.city || undefined,
            },
        )
            .then((res) => {
                if (cancelled) {
                    return;
                }

                setOptions(res.success && res.data?.options ? res.data.options : []);
            })
            .catch(() => {
                if (!cancelled) {
                    setOptions([]);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [
        enabled,
        filters.level,
        filters.state_code,
        filters.district,
        filters.taluka,
        filters.city,
    ]);

    return { options, loading };
}

export function withLegacyLocalityOption(
    options: AddressLocalityOption[],
    currentValue: string,
): AddressLocalityOption[] {
    const value = currentValue.trim();

    if (!value || options.some((option) => option.value === value)) {
        return options;
    }

    return [{ value, label: value }, ...options];
}
