<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Expense extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'expense_date',
        'category',
        'amount',
        'description',
        'vehicle_id',
        'driver_id',
        'payment_method',
        'bill_copy',
    ];

    protected $appends = [
        'bill_copy_url',
    ];

    protected function casts(): array
    {
        return [
            'expense_date' => 'date',
            'amount' => 'decimal:2',
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

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function getBillCopyUrlAttribute(): ?string
    {
        if (! $this->bill_copy) {
            return null;
        }

        return Storage::disk('public')->url($this->bill_copy);
    }
}
