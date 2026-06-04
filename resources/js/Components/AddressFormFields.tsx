import {
    FormField,
    FormGrid,
    FormSectionHeader,
    formControlClass,
} from '@/Components/FormPage';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import {
    useAddressLocalityOptions,
    withLegacyLocalityOption,
} from '@/hooks/useAddressLocalityOptions';
import { fieldInputClass } from '@/lib/apiFormErrors';
import { normalizeCountry, type AddressFormData } from '@/lib/addressValidation';

type AddressFormFieldsProps = {
    data: AddressFormData;
    errors: Record<string, string>;
    onChange: <K extends keyof AddressFormData>(field: K, value: AddressFormData[K]) => void;
};

function selectClass(hasError: boolean) {
    return fieldInputClass(hasError, formControlClass);
}

export default function AddressFormFields({ data, errors, onChange }: AddressFormFieldsProps) {
    const patch = (updates: Partial<AddressFormData>) => {
        (Object.keys(updates) as (keyof AddressFormData)[]).forEach((key) => {
            onChange(key, updates[key] as string);
        });
    };

    const { options: stateOptions, loading: statesLoading } = useAddressLocalityOptions({
        level: 'state',
    });

    const { options: districtOptions, loading: districtsLoading } = useAddressLocalityOptions(
        { level: 'district', state_code: data.state_code },
        Boolean(data.state_code),
    );

    const { options: talukaOptions, loading: talukasLoading } = useAddressLocalityOptions(
        { level: 'taluka', state_code: data.state_code, district: data.district },
        Boolean(data.state_code && data.district),
    );

    const { options: cityOptions, loading: citiesLoading } = useAddressLocalityOptions(
        {
            level: 'city',
            state_code: data.state_code,
            district: data.district,
            taluka: data.taluka,
        },
        Boolean(data.state_code && data.district && data.taluka),
    );

    const { options: pincodeOptions, loading: pincodesLoading } = useAddressLocalityOptions(
        {
            level: 'pincode',
            state_code: data.state_code,
            district: data.district,
            taluka: data.taluka,
            city: data.city,
        },
        Boolean(data.state_code && data.district && data.taluka && data.city),
    );

    const inputClass = (field: keyof AddressFormData) =>
        fieldInputClass(Boolean(errors[field]), formControlClass);

    const emptyHint = (parent: string) => `Select ${parent} first`;

    return (
        <div className="space-y-5">
            <FormSectionHeader title="Address" />

            <FormField width="full">
                <InputLabel value="State" />
                <select
                    className={selectClass(Boolean(errors.state_code))}
                    value={data.state_code}
                    onChange={(e) =>
                        patch({
                            state_code: e.target.value,
                            district: '',
                            taluka: '',
                            city: '',
                            pincode: '',
                        })
                    }
                >
                    <option value="">
                        {statesLoading ? 'Loading states…' : 'Select state'}
                    </option>
                    {withLegacyLocalityOption(stateOptions, data.state_code).map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <InputError message={errors.state_code} className="mt-1" />
            </FormField>

            <FormGrid cols={3}>
                <FormField width="md">
                    <InputLabel value="District" />
                    <select
                        className={selectClass(Boolean(errors.district))}
                        value={data.district}
                        disabled={!data.state_code}
                        onChange={(e) =>
                            patch({
                                district: e.target.value,
                                taluka: '',
                                city: '',
                                pincode: '',
                            })
                        }
                    >
                        <option value="">
                            {!data.state_code
                                ? emptyHint('state')
                                : districtsLoading
                                  ? 'Loading…'
                                  : 'Select district'}
                        </option>
                        {withLegacyLocalityOption(districtOptions, data.district).map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.district} className="mt-1" />
                </FormField>

                <FormField width="md">
                    <InputLabel value="Taluka" />
                    <select
                        className={selectClass(Boolean(errors.taluka))}
                        value={data.taluka}
                        disabled={!data.district}
                        onChange={(e) =>
                            patch({
                                taluka: e.target.value,
                                city: '',
                                pincode: '',
                            })
                        }
                    >
                        <option value="">
                            {!data.district
                                ? emptyHint('district')
                                : talukasLoading
                                  ? 'Loading…'
                                  : 'Select taluka'}
                        </option>
                        {withLegacyLocalityOption(talukaOptions, data.taluka).map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.taluka} className="mt-1" />
                </FormField>

                <FormField width="md">
                    <InputLabel value="City" />
                    <select
                        className={selectClass(Boolean(errors.city))}
                        value={data.city}
                        disabled={!data.taluka}
                        onChange={(e) =>
                            patch({
                                city: e.target.value,
                                pincode: '',
                            })
                        }
                    >
                        <option value="">
                            {!data.taluka
                                ? emptyHint('taluka')
                                : citiesLoading
                                  ? 'Loading…'
                                  : 'Select city'}
                        </option>
                        {withLegacyLocalityOption(cityOptions, data.city).map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.city} className="mt-1" />
                </FormField>
            </FormGrid>

            <FormGrid cols={3}>
                <FormField width="sm">
                    <InputLabel value="Pincode" />
                    <select
                        className={selectClass(Boolean(errors.pincode))}
                        value={data.pincode}
                        disabled={!data.city}
                        onChange={(e) => onChange('pincode', e.target.value)}
                    >
                        <option value="">
                            {!data.city
                                ? emptyHint('city')
                                : pincodesLoading
                                  ? 'Loading…'
                                  : 'Select pincode'}
                        </option>
                        {withLegacyLocalityOption(pincodeOptions, data.pincode).map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.pincode} className="mt-1" />
                </FormField>

                <FormField width="md">
                    <InputLabel value="Country" />
                    <TextInput
                        readOnly
                        tabIndex={-1}
                        aria-readonly="true"
                        className={`${formControlClass} cursor-default bg-gray-50 text-gray-700`}
                        value={normalizeCountry(data.country)}
                    />
                </FormField>
            </FormGrid>

            <FormField width="full">
                <InputLabel value="Full Address" />
                <textarea
                    className={`${inputClass('full_address')} rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
                    rows={4}
                    value={data.full_address}
                    onChange={(e) => onChange('full_address', e.target.value)}
                    placeholder="Street, building, landmark, etc."
                />
                <InputError message={errors.full_address} className="mt-1" />
            </FormField>
        </div>
    );
}
