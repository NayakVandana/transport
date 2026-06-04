<?php

return [
    'fields' => [
        'vehicle_number' => 'Vehicle Number',
        'vehicle_type' => 'Vehicle Type',
        'brand' => 'Brand',
        'model' => 'Model',
        'capacity' => 'Capacity',
        'fuel_type' => 'Fuel Type',
        'insurance_number' => 'Insurance Number',
        'insurance_expiry' => 'Insurance Expiry',
        'permit_number' => 'Permit Number',
        'permit_expiry' => 'Permit Expiry',
        'pollution_expiry' => 'PUC Expiry',
        'fitness_expiry' => 'Fitness Expiry',
        'status' => 'Status',
    ],

    'messages' => [
        'vehicle_number' => [
            'required' => 'Please enter the vehicle registration number (e.g. MH04JU9931).',
            'max' => 'Vehicle number cannot exceed 20 characters.',
            'unique' => 'This vehicle number is already registered in your fleet.',
        ],
        'vehicle_type' => [
            'required' => 'Please enter the vehicle type (e.g. Truck, Container).',
            'max' => 'Vehicle type cannot exceed 100 characters.',
        ],
        'brand' => [
            'required' => 'Please enter the vehicle brand (e.g. Tata, Ashok Leyland).',
            'max' => 'Brand cannot exceed 100 characters.',
        ],
        'model' => [
            'required' => 'Please enter the vehicle model.',
            'max' => 'Model cannot exceed 100 characters.',
        ],
        'capacity' => [
            'max' => 'Capacity cannot exceed 50 characters.',
        ],
        'fuel_type' => [
            'required' => 'Please select the fuel type.',
            'in' => 'Please select a valid fuel type.',
        ],
        'insurance_number' => [
            'required' => 'Please enter the insurance policy number.',
            'max' => 'Insurance number cannot exceed 50 characters.',
        ],
        'insurance_expiry' => [
            'required' => 'Please select the insurance expiry date.',
            'date' => 'Insurance expiry must be a valid date.',
        ],
        'permit_number' => [
            'required' => 'Please enter the permit number.',
            'max' => 'Permit number cannot exceed 50 characters.',
        ],
        'permit_expiry' => [
            'required' => 'Please select the permit expiry date.',
            'date' => 'Permit expiry must be a valid date.',
        ],
        'pollution_expiry' => [
            'required' => 'Please select the PUC expiry date.',
            'date' => 'PUC expiry must be a valid date.',
        ],
        'fitness_expiry' => [
            'required' => 'Please select the fitness certificate expiry date.',
            'date' => 'Fitness expiry must be a valid date.',
        ],
        'status' => [
            'required' => 'Please select whether the vehicle is active or inactive.',
            'in' => 'Status must be either Active or Inactive.',
        ],
    ],

    'fuel_types' => ['Diesel', 'Petrol', 'CNG', 'Electric', 'LPG'],
];
