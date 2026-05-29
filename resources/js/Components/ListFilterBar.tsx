import FormDatePicker, { type DatePickerRangeValue } from '@/Components/FormDatePicker';
import SecondaryButton from '@/Components/SecondaryButton';
import type { ReactNode } from 'react';

export type ListFilterSelect = {
    name: string;
    label: string;
    value: string;
    options: { value: string; label: string }[];
    allLabel?: string;
    widthClass?: string;
    onChange: (value: string) => void;
};

type ListFilterBarProps = {
    dateValue: DatePickerRangeValue;
    onDateChange: (value: DatePickerRangeValue) => void;
    search?: {
        value: string;
        placeholder: string;
        onChange: (value: string) => void;
        onSubmit?: () => void;
    };
    selects?: ListFilterSelect[];
    filterSummary: string;
    hasActiveFilters: boolean;
    onClear: () => void;
    actions?: ReactNode;
};

export default function ListFilterBar({
    dateValue,
    onDateChange,
    search,
    selects = [],
    filterSummary,
    hasActiveFilters,
    onClear,
    actions,
}: ListFilterBarProps) {
    return (
        <div className="rounded-lg bg-white p-3 shadow">
            <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                <FormDatePicker
                    value={dateValue}
                    onChange={onDateChange}
                    isRange
                    useRange
                />

                {search && (
                    <div className="flex min-w-[10rem] flex-1 items-center gap-1.5 border-l border-gray-200 pl-2">
                        <label className="sr-only" htmlFor="list_filter_search">
                            Search
                        </label>
                        <input
                            id="list_filter_search"
                            type="search"
                            value={search.value}
                            onChange={(e) => search.onChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    search.onSubmit?.();
                                }
                            }}
                            placeholder={search.placeholder}
                            className="w-full min-w-[8rem] rounded-md border-gray-300 py-1 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                )}

                {selects.map((select) => (
                    <div
                        key={select.name}
                        className="flex shrink-0 items-center gap-1.5 border-l border-gray-200 pl-2"
                    >
                        <label htmlFor={select.name} className="sr-only">
                            {select.label}
                        </label>
                        <select
                            id={select.name}
                            name={select.name}
                            value={select.value}
                            onChange={(e) => select.onChange(e.target.value)}
                            className={`${select.widthClass ?? 'w-[9.5rem]'} rounded-md border-gray-300 py-1 pl-2 pr-7 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
                        >
                            <option value="">{select.allLabel ?? `All ${select.label.toLowerCase()}`}</option>
                            {select.options.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}

                <div className="flex h-8 w-[3.25rem] shrink-0 items-center">
                    <SecondaryButton
                        type="button"
                        onClick={onClear}
                        tabIndex={hasActiveFilters ? 0 : -1}
                        className={`!px-2.5 !py-1 normal-case tracking-normal ${
                            hasActiveFilters ? '' : 'pointer-events-none invisible'
                        }`}
                    >
                        Clear
                    </SecondaryButton>
                </div>

                {(actions || filterSummary) && (
                    <div className="ml-auto flex shrink-0 items-center gap-2 lg:min-w-[12rem] lg:justify-end">
                        <span className="hidden text-xs text-gray-500 sm:inline">{filterSummary}</span>
                        {actions}
                    </div>
                )}
            </div>

            <p className="mt-1.5 text-xs text-gray-500 sm:hidden">{filterSummary}</p>
        </div>
    );
}
