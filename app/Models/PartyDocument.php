<?php

namespace App\Models;

use App\Support\DocumentStorage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PartyDocument extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'party_id',
        'document_type',
        'title',
        'file_path',
        'expiry_date',
        'notes',
    ];

    protected $appends = [
        'file_url',
    ];

    protected function casts(): array
    {
        return [
            'expiry_date' => 'date',
        ];
    }

    protected static function booted(): void
    {
        static::deleting(function (PartyDocument $document) {
            DocumentStorage::delete($document->file_path);
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function party(): BelongsTo
    {
        return $this->belongsTo(Party::class);
    }

    public function getFileUrlAttribute(): ?string
    {
        return DocumentStorage::url($this->file_path);
    }
}
