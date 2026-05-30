<?php

return [
    'fields' => [
        'entry_number' => 'Entry No.',
        'entry_date' => 'Date',
        'vehicle_id' => 'Vehicle',
        'route_from' => 'From',
        'freight' => 'Freight',
        'advance' => 'Advance',
    ],

    'messages' => [
        'entry_number' => [
            'required' => 'Please enter the entry number.',
            'max' => 'Entry number is too long.',
            'unique' => 'This entry number is already used.',
        ],
        'entry_date' => [
            'required' => 'Please select the date.',
            'date' => 'Date must be valid.',
        ],
        'vehicle_id' => [
            'required' => 'Please select a vehicle.',
            'exists' => 'The selected vehicle is not valid.',
        ],
        'route_from' => [
            'max' => 'From route is too long.',
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
    ],
];
