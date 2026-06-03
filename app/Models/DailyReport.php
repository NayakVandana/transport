<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class DailyReport extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'serial_number',
        'report_date',
        'vehicle_id',
        'description',
        'current_party_id',
        'planning_party_id',
        'location',
        'detention',
        'day',
    ];

    protected function casts(): array
    {
        return [
            'report_date' => 'date',
            'detention' => 'decimal:2',
            'day' => 'integer',
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

    public function currentParty(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'current_party_id');
    }

    public function planningParty(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'planning_party_id');
    }
}
