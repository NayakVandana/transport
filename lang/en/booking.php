<?php

return [
    'fields' => [
        'booking_date' => 'Date',
        'vehicle_id' => 'Vehicle',
        'driver_id' => 'Driver',
        'freight' => 'Freight',
        'advance' => 'Advance',
        'empty_charge' => 'Empty',
        'maintenance' => 'Maintenance',
    ],

    'messages' => [
        'booking_date' => [
            'required' => 'Please select the booking date.',
            'date' => 'Booking date must be a valid date.',
        ],
        'vehicle_id' => [
            'required' => 'Please select a vehicle.',
            'exists' => 'The selected vehicle is not valid.',
        ],
        'driver_id' => [
            'exists' => 'The selected driver is not valid.',
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
        'maintenance' => [
            'numeric' => 'Maintenance must be a valid amount.',
            'min' => 'Maintenance cannot be negative.',
        ],
    ],
];
