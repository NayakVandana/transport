<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Booking extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'booking_date',
        'vehicle_id',
        'freight',
        'advance',
        'empty_charge',
        'maintenance',
        'balance',
    ];

    protected function casts(): array
    {
        return [
            'booking_date' => 'date',
            'freight' => 'decimal:2',
            'advance' => 'decimal:2',
            'empty_charge' => 'decimal:2',
            'maintenance' => 'decimal:2',
            'balance' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }
}
