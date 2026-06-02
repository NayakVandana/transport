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
    /** Inside a parent card (party tabs) — no shadow, lighter styling. */
    embedded?: boolean;
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
    embedded = false,
}: ListFilterBarProps) {
    return (
        <div
            className={
                embedded
                    ? 'border-b border-gray-100 bg-gray-50/80 p-3 sm:rounded-lg sm:border sm:border-gray-200'
                    : 'rounded-lg bg-white p-3 shadow'
            }
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:flex-nowrap">
                <div className="w-full min-w-0 sm:w-auto sm:max-w-xs lg:max-w-none">
                    <FormDatePicker
                        value={dateValue}
                        onChange={onDateChange}
                        isRange
                        useRange
                    />
                </div>

                {search && (
                    <div className="flex w-full min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-1.5 sm:border-l sm:border-gray-200 sm:pl-2">
                        <label
                            htmlFor="list_filter_search"
                            className="text-xs font-medium text-gray-600 sm:sr-only"
                        >
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
                            className="w-full min-w-0 rounded-md border-gray-300 py-1 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                )}

                {selects.map((select) => (
                    <div
                        key={select.name}
                        className="flex w-full min-w-0 flex-col gap-1 sm:w-auto sm:shrink-0 sm:border-l sm:border-gray-200 sm:pl-2"
                    >
                        <label
                            htmlFor={select.name}
                            className="text-xs font-medium text-gray-600 sm:sr-only"
                        >
                            {select.label}
                        </label>
                        <select
                            id={select.name}
                            name={select.name}
                            value={select.value}
                            onChange={(e) => select.onChange(e.target.value)}
                            className={`w-full ${select.widthClass ?? 'sm:w-[9.5rem]'} rounded-md border-gray-300 py-1 pl-2 pr-7 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
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

                <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
                    <SecondaryButton
                        type="button"
                        onClick={onClear}
                        tabIndex={hasActiveFilters ? 0 : -1}
                        className={`w-full sm:w-auto !px-2.5 !py-1 normal-case tracking-normal ${
                            hasActiveFilters ? '' : 'pointer-events-none invisible'
                        }`}
                    >
                        Clear filters
                    </SecondaryButton>
                </div>

                {(actions || filterSummary) && (
                    <div className="flex w-full shrink-0 flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:items-center lg:min-w-[12rem] lg:justify-end">
                        <span className="hidden text-xs text-gray-500 sm:inline">{filterSummary}</span>
                        {actions ? (
                            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                                {actions}
                            </div>
                        ) : null}
                    </div>
                )}
            </div>

            {filterSummary ? (
                <p className="mt-2 rounded-md bg-gray-50 px-2.5 py-1.5 text-xs text-gray-600 sm:hidden">
                    {filterSummary}
                </p>
            ) : null}
        </div>
    );
}
