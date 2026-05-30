<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FreightInvoice extends Model
{
    protected $fillable = [
        'user_id',
        'company_id',
        'party_id',
        'bill_number',
        'invoice_date',
        'sac_code',
        'status',
        'total_weight',
        'total_freight',
        'total_empty_container_charge',
        'net_value',
        'total_advance',
        'balance_amount',
        'gross_freight',
        'igst_rate',
        'igst_amount',
        'balance_in_words',
        'prepared_by',
        'checked_by',
    ];

    protected function casts(): array
    {
        return [
            'invoice_date' => 'date',
            'total_weight' => 'decimal:3',
            'total_freight' => 'decimal:2',
            'total_empty_container_charge' => 'decimal:2',
            'net_value' => 'decimal:2',
            'total_advance' => 'decimal:2',
            'balance_amount' => 'decimal:2',
            'gross_freight' => 'decimal:2',
            'igst_rate' => 'decimal:4',
            'igst_amount' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function party(): BelongsTo
    {
        return $this->belongsTo(Party::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(FreightInvoiceLine::class)->orderBy('serial_number');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(InvoicePayment::class)->orderByDesc('payment_date');
    }
}
