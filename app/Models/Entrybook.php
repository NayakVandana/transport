<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Entrybook extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'entry_number',
        'entry_date',
        'vehicle_id',
        'route_from',
        'freight',
        'advance',
        'balance',
    ];

    protected function casts(): array
    {
        return [
            'entry_date' => 'date',
            'freight' => 'decimal:2',
            'advance' => 'decimal:2',
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
