import dayjs from 'dayjs';
import Datepicker, { type DateValueType } from 'react-tailwindcss-datepicker';

export interface DatePickerRangeValue {
    startDate: string | null;
    endDate: string | null;
}

interface Props {
    id?: string;
    name?: string;
    value: DatePickerRangeValue;
    onChange: (value: DatePickerRangeValue) => void;
    isRange?: boolean;
    useRange?: boolean;
    className?: string;
    placeholder?: string;
    noMaxDate?: boolean;
    disabled?: boolean;
}

export default function FormDatePicker({
    id,
    name,
    value,
    onChange,
    isRange = true,
    useRange = true,
    className = '',
    placeholder = 'Select Date',
    noMaxDate = false,
    disabled = false,
}: Props) {
    const pickerValue: DateValueType = {
        startDate: value.startDate ? new Date(value.startDate) : null,
        endDate: value.endDate ? new Date(value.endDate) : null,
    };

    const handleChange = (date: DateValueType) => {
        if (!date?.startDate) {
            onChange({ startDate: null, endDate: null });
            return;
        }

        const startDate = dayjs(date.startDate).format('YYYY-MM-DD');
        const endDate = date.endDate
            ? dayjs(date.endDate).format('YYYY-MM-DD')
            : startDate;

        onChange({ startDate, endDate });
    };

    return (
        <Datepicker
            inputId={id}
            inputName={name}
            inputClassName={`w-full min-w-[15rem] rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${className}`}
            placeholder={placeholder}
            asSingle={!isRange}
            useRange={useRange}
            value={pickerValue}
            onChange={handleChange}
            maxDate={noMaxDate ? undefined : new Date()}
            displayFormat={isRange ? 'DD MMM YY' : 'DD MMM YYYY'}
            showShortcuts={isRange}
            dateLooking="middle"
            disabled={disabled}
            primaryColor="indigo"
        />
    );
}
