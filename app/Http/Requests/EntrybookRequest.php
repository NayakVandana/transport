<?php

namespace App\Http\Requests;

use App\Support\EntrybookValidation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EntrybookRequest extends FormRequest
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
            'entry_date' => ['required', 'date'],
            'vehicle_id' => [
                'required',
                'integer',
                Rule::exists('vehicles', 'id')->where(
                    fn ($query) => $query->where('user_id', $this->user()->id)->whereNull('deleted_at'),
                ),
            ],
            'route_from' => ['nullable', 'string', 'max:255'],
            'freight' => ['required', 'numeric', 'min:0'],
            'advance' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return EntrybookValidation::requestMessages();
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        /** @var array<string, string> $fields */
        $fields = __('entrybook.fields');

        return $fields;
    }
}
