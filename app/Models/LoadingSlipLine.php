<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoadingSlipLine extends Model
{
    protected $fillable = [
        'loading_slip_id',
        'serial_number',
        'vehicle_id',
        'vehicle_number',
        'destination',
        'freight_rate',
        'advance',
        'balance',
    ];

    protected function casts(): array
    {
        return [
            'freight_rate' => 'decimal:2',
            'advance' => 'decimal:2',
            'balance' => 'decimal:2',
        ];
    }

    public function loadingSlip(): BelongsTo
    {
        return $this->belongsTo(LoadingSlip::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }
}
