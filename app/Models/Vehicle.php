<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vehicle extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'vehicle_number',
        'vehicle_type',
        'brand',
        'model',
        'capacity',
        'fuel_type',
        'insurance_number',
        'insurance_expiry',
        'permit_number',
        'permit_expiry',
        'pollution_expiry',
        'fitness_expiry',
        'tax_name',
        'tax_expiry',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'insurance_expiry' => 'date',
            'permit_expiry' => 'date',
            'pollution_expiry' => 'date',
            'fitness_expiry' => 'date',
            'tax_expiry' => 'date',
        ];
    }

    /** @param  Builder<self>  $query */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId)->where('status', 'active');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(VehicleDocument::class);
    }

    public function vehicleExpenses(): HasMany
    {
        return $this->hasMany(VehicleExpense::class);
    }
}
