<?php

namespace App\Models;

use App\Models\Concerns\HasDefaultCountry;
use App\Support\DocumentStorage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Party extends Model
{
    use HasDefaultCountry;

    protected $fillable = [
        'user_id',
        'name',
        'party_owner_name',
        'photo_path',
        'email',
        'pan_no',
        'gst_no',
        'international_tax_id',
        'mobile',
        'mobiles',
        'address',
        'full_address',
        'city',
        'taluka',
        'district',
        'pincode',
        'state_code',
        'country',
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
            'mobiles' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function freightInvoices(): HasMany
    {
        return $this->hasMany(FreightInvoice::class);
    }

    public function invoicePayments(): HasMany
    {
        return $this->hasMany(InvoicePayment::class);
    }

    public function entrybooks(): HasMany
    {
        return $this->hasMany(Entrybook::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(PartyDocument::class);
    }

    protected static function booted(): void
    {
        static::updating(function (Party $party) {
            if ($party->isDirty('photo_path')) {
                DocumentStorage::delete($party->getOriginal('photo_path'));
            }
        });

        static::deleting(function (Party $party) {
            DocumentStorage::delete($party->photo_path);
        });
    }

    public function getPhotoUrlAttribute(): ?string
    {
        return DocumentStorage::url($this->photo_path);
    }
}
