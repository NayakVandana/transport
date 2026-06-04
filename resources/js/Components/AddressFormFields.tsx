import {
    FormField,
    FormGrid,
    FormSectionHeader,
    formControlClass,
} from '@/Components/FormPage';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { fieldInputClass } from '@/lib/apiFormErrors';
import {
    DEFAULT_COUNTRY,
    normalizeCountry,
    type AddressFormData,
} from '@/lib/addressValidation';

type AddressFormFieldsProps = {
    data: AddressFormData;
    errors: Record<string, string>;
    onChange: <K extends keyof AddressFormData>(field: K, value: AddressFormData[K]) => void;
};

export default function AddressFormFields({ data, errors, onChange }: AddressFormFieldsProps) {
    const inputClass = (field: keyof AddressFormData) =>
        fieldInputClass(Boolean(errors[field]), formControlClass);

    return (
        <div className="space-y-5">
            <FormSectionHeader title="Address" />
            <FormField width="full">
                <InputLabel value="Full Address" />
                <textarea
                    className={`${inputClass('full_address')} rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
                    rows={4}
                    value={data.full_address}
                    onChange={(e) => onChange('full_address', e.target.value)}
                />
                <InputError message={errors.full_address} className="mt-1" />
            </FormField>

            <FormGrid cols={3}>
                <FormField width="md">
                    <InputLabel value="City" />
                    <TextInput
                        className={inputClass('city')}
                        value={data.city}
                        onChange={(e) => onChange('city', e.target.value)}
                    />
                    <InputError message={errors.city} className="mt-1" />
                </FormField>
                <FormField width="md">
                    <InputLabel value="Taluka" />
                    <TextInput
                        className={inputClass('taluka')}
                        value={data.taluka}
                        onChange={(e) => onChange('taluka', e.target.value)}
                    />
                    <InputError message={errors.taluka} className="mt-1" />
                </FormField>
                <FormField width="md">
                    <InputLabel value="District" />
                    <TextInput
                        className={inputClass('district')}
                        value={data.district}
                        onChange={(e) => onChange('district', e.target.value)}
                    />
                    <InputError message={errors.district} className="mt-1" />
                </FormField>
            </FormGrid>

            <FormGrid cols={3}>
                <FormField width="sm">
                    <InputLabel value="Pincode" />
                    <TextInput
                        className={inputClass('pincode')}
                        value={data.pincode}
                        onChange={(e) => onChange('pincode', e.target.value)}
                    />
                    <InputError message={errors.pincode} className="mt-1" />
                </FormField>
                <FormField width="sm">
                    <InputLabel value="State Code" />
                    <TextInput
                        className={inputClass('state_code')}
                        value={data.state_code}
                        onChange={(e) => onChange('state_code', e.target.value)}
                        placeholder="e.g. 24"
                    />
                    <InputError message={errors.state_code} className="mt-1" />
                </FormField>
                <FormField width="md">
                    <InputLabel value="Country" />
                    <TextInput
                        className={inputClass('country')}
                        value={normalizeCountry(data.country)}
                        onChange={(e) => onChange('country', e.target.value)}
                        placeholder={DEFAULT_COUNTRY}
                    />
                    <InputError message={errors.country} className="mt-1" />
                </FormField>
            </FormGrid>
        </div>
    );
}
