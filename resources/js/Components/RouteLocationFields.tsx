import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import MasterDataSelect from '@/Components/MasterDataSelect';
import { FormSectionHeader } from '@/Components/FormPage';

type LocationOption = { value: string; label: string };

type RouteLocationFieldsProps = {
    fromValue: string;
    toValue: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
    locationOptions: LocationOption[];
    locationsHref: string;
    errors?: {
        route_from?: string;
        route_to?: string;
    };
    showHeader?: boolean;
};

export default function RouteLocationFields({
    fromValue,
    toValue,
    onFromChange,
    onToChange,
    locationOptions,
    locationsHref,
    errors,
    showHeader = true,
}: RouteLocationFieldsProps) {
    const toOptions = locationOptions.filter((option) => option.value !== fromValue);
    const fromOptions = locationOptions.filter((option) => option.value !== toValue);

    return (
        <div className="space-y-4">
            {showHeader && (
                <FormSectionHeader
                    title="Route"
                    description="From and to locations for this trip."
                />
            )}

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <InputLabel value="From Location *" />
                    <MasterDataSelect
                        className="mt-1 block w-full"
                        value={fromValue}
                        options={fromOptions}
                        emptyLabel="e.g. Silvassa"
                        addLabel="+ Add location"
                        addHref={locationsHref}
                        onChange={onFromChange}
                    />
                    <InputError message={errors?.route_from} className="mt-1" />
                </div>

                <div>
                    <InputLabel value="To Location *" />
                    <MasterDataSelect
                        className="mt-1 block w-full"
                        value={toValue}
                        options={toOptions}
                        emptyLabel="e.g. Jaipur"
                        addLabel="+ Add location"
                        addHref={locationsHref}
                        onChange={onToChange}
                    />
                    <InputError message={errors?.route_to} className="mt-1" />
                </div>
            </div>
        </div>
    );
}
