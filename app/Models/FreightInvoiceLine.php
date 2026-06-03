<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FreightInvoiceLine extends Model
{
    protected $fillable = [
        'freight_invoice_id',
        'entrybook_id',
        'serial_number',
        'entry_number',
        'entry_date',
        'vehicle_number',
        'route_from',
        'product_name',
        'weight',
        'rate',
        'freight',
        'advance_paid',
        'empty_container_charge',
        'detention',
    ];

    protected function casts(): array
    {
        return [
            'entry_date' => 'date',
            'weight' => 'decimal:3',
            'rate' => 'decimal:2',
            'freight' => 'decimal:2',
            'advance_paid' => 'decimal:2',
            'empty_container_charge' => 'decimal:2',
            'detention' => 'decimal:2',
        ];
    }

    public function freightInvoice(): BelongsTo
    {
        return $this->belongsTo(FreightInvoice::class);
    }

    public function entrybook(): BelongsTo
    {
        return $this->belongsTo(Entrybook::class);
    }
}
