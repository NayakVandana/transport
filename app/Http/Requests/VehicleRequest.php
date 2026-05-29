<?php

namespace App\Http\Requests;

use App\Support\VehicleValidation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('vehicle_number')) {
            $this->merge([
                'vehicle_number' => strtoupper(trim((string) $this->vehicle_number)),
            ]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $vehicleId = $this->route('vehicle')?->id;

        return [
            'vehicle_number' => [
                'required',
                'string',
                'max:20',
                Rule::unique('vehicles', 'vehicle_number')
                    ->where(fn ($query) => $query
                        ->where('user_id', $this->user()->id)
                        ->whereNull('deleted_at'))
                    ->ignore($vehicleId),
            ],
            'vehicle_type' => ['required', 'string', 'max:100'],
            'brand' => ['required', 'string', 'max:100'],
            'model' => ['required', 'string', 'max:100'],
            'capacity' => ['nullable', 'string', 'max:50'],
            'fuel_type' => ['required', 'string', Rule::in(VehicleValidation::fuelTypes())],
            'insurance_number' => ['required', 'string', 'max:50'],
            'insurance_expiry' => ['required', 'date'],
            'permit_number' => ['required', 'string', 'max:50'],
            'permit_expiry' => ['required', 'date'],
            'pollution_expiry' => ['required', 'date'],
            'fitness_expiry' => ['required', 'date'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return VehicleValidation::requestMessages();
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return VehicleValidation::fieldLabels();
    }
}
