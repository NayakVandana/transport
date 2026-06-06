import { Link, router } from '@inertiajs/react';

const ADD_NEW = '__add_new__';

type Option = { value: string; label: string };

type Props = {
    value: string;
    options: Option[];
    emptyLabel: string;
    addLabel: string;
    addHref: string;
    onChange: (value: string) => void;
    className?: string;
    id?: string;
    autoComplete?: string;
};

export default function MasterDataSelect({
    value,
    options,
    emptyLabel,
    addLabel,
    addHref,
    onChange,
    className = 'w-full rounded-md border-gray-300 text-sm shadow-sm',
    id,
    autoComplete = 'off',
}: Props) {
    const selectedValue = value ?? '';
    const known = new Set(options.map((o) => o.value));
    const allOptions =
        selectedValue && !known.has(selectedValue)
            ? [{ value: selectedValue, label: selectedValue }, ...options]
            : options;

    const handleSelect = (selected: string) => {
        if (selected === ADD_NEW) {
            router.visit(addHref);
            return;
        }
        onChange(selected);
    };

    if (allOptions.length === 0) {
        return (
            <Link
                href={addHref}
                className="flex w-full items-center justify-center rounded-md border border-dashed border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
            >
                {addLabel}
            </Link>
        );
    }

    return (
        <select
            id={id}
            name={id}
            autoComplete={autoComplete}
            className={className}
            value={selectedValue}
            onChange={(e) => handleSelect(e.target.value)}
        >
            <option value="">{emptyLabel}</option>
            {allOptions.map((o) => (
                <option key={`${id ?? 'select'}-${o.value}`} value={o.value}>
                    {o.label}
                </option>
            ))}
            <option value={ADD_NEW}>{addLabel}</option>
        </select>
    );
}
