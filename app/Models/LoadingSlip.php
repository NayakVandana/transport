<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class LoadingSlip extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'party_id',
        'slip_date',
        'loading_date',
        'route_from',
        'route_to',
        'authorized_signatory',
        'freight_invoice_id',
        'status',
        'total_freight',
        'total_advance',
        'total_balance',
    ];

    protected function casts(): array
    {
        return [
            'slip_date' => 'date',
            'loading_date' => 'date',
            'total_freight' => 'decimal:2',
            'total_advance' => 'decimal:2',
            'total_balance' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function party(): BelongsTo
    {
        return $this->belongsTo(Party::class);
    }

    public function freightInvoice(): BelongsTo
    {
        return $this->belongsTo(FreightInvoice::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(LoadingSlipLine::class)->orderBy('serial_number');
    }
}
