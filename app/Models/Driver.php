<?php

namespace App\Models;

use App\Models\Concerns\HasDefaultCountry;
use App\Support\DocumentStorage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Driver extends Model
{
    use HasDefaultCountry;
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'name',
        'photo_path',
        'email',
        'aadhaar_no',
        'pan_no',
        'mobile',
        'mobiles',
        'license_number',
        'license_expiry',
        'joining_date',
        'salary',
        'address',
        'full_address',
        'city',
        'taluka',
        'district',
        'pincode',
        'state_code',
        'country',
        'status',
    ];

    protected $hidden = [
        'photo_path',
    ];

    protected $appends = [
        'photo_url',
    ];

    protected function casts(): array
    {
        return [
            'license_expiry' => 'date',
            'joining_date' => 'date',
            'salary' => 'decimal:2',
            'mobiles' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(DriverDocument::class);
    }

    protected static function booted(): void
    {
        static::updating(function (Driver $driver) {
            if ($driver->isDirty('photo_path')) {
                DocumentStorage::delete($driver->getOriginal('photo_path'));
            }
        });

        static::deleting(function (Driver $driver) {
            DocumentStorage::delete($driver->photo_path);
        });
    }

    public function getPhotoUrlAttribute(): ?string
    {
        return DocumentStorage::url($this->photo_path);
    }
}
