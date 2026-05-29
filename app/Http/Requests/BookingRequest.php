<?php

namespace App\Http\Requests;

use App\Support\BookingValidation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('vehicle_id') && $this->vehicle_id !== '') {
            $this->merge([
                'vehicle_id' => (int) $this->vehicle_id,
            ]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'booking_date' => ['required', 'date'],
            'vehicle_id' => [
                'required',
                'integer',
                Rule::exists('vehicles', 'id')->where(
                    fn ($query) => $query->where('user_id', $this->user()->id)->whereNull('deleted_at'),
                ),
            ],
            'freight' => ['required', 'numeric', 'min:0'],
            'advance' => ['nullable', 'numeric', 'min:0'],
            'empty_charge' => ['nullable', 'numeric', 'min:0'],
            'maintenance' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return BookingValidation::requestMessages();
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        /** @var array<string, string> $fields */
        $fields = __('booking.fields');

        return $fields;
    }
}
