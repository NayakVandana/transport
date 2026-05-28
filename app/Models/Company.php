<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'pan',
        'gst',
        'udyam_reg_no',
        'udyam_date',
        'jurisdiction',
        'sac_code',
        'entry_number_prefix',
        'entry_next_sequence',
        'igst_rate',
        'bank_account_name',
        'bank_account_no',
        'bank_ifsc',
        'bank_name',
        'bank_branch',
        'address',
    ];

    protected function casts(): array
    {
        return [
            'udyam_date' => 'date',
            'entry_next_sequence' => 'integer',
            'igst_rate' => 'decimal:4',
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
}
