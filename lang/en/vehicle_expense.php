<?php

return [
    'fields' => [
        'expense_date' => 'Date',
        'vehicle_id' => 'Vehicle',
        'freight' => 'Freight',
        'advance' => 'Advance',
        'empty_charge' => 'Empty',
        'toll' => 'Toll',
        'maintenance' => 'Maintenance',
    ],

    'messages' => [
        'expense_date' => [
            'required' => 'Please select the date.',
            'date' => 'Date must be valid.',
        ],
        'vehicle_id' => [
            'required' => 'Please select a vehicle.',
            'exists' => 'The selected vehicle is not valid.',
        ],
        'freight' => [
            'required' => 'Please enter the freight amount.',
            'numeric' => 'Freight must be a valid amount.',
            'min' => 'Freight cannot be negative.',
        ],
        'advance' => [
            'numeric' => 'Advance must be a valid amount.',
            'min' => 'Advance cannot be negative.',
        ],
        'empty_charge' => [
            'numeric' => 'Empty charge must be a valid amount.',
            'min' => 'Empty charge cannot be negative.',
        ],
        'toll' => [
            'numeric' => 'Toll must be a valid amount.',
            'min' => 'Toll cannot be negative.',
        ],
        'maintenance' => [
            'numeric' => 'Maintenance must be a valid amount.',
            'min' => 'Maintenance cannot be negative.',
        ],
    ],
];
