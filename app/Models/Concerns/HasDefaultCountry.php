<?php

namespace App\Models\Concerns;

trait HasDefaultCountry
{
    public function getCountryAttribute(?string $value): string
    {
        $trimmed = trim((string) $value);

        return $trimmed !== '' ? $trimmed : 'India';
    }

    public function setCountryAttribute(?string $value): void
    {
        $trimmed = trim((string) $value);
        $this->attributes['country'] = $trimmed !== '' ? $trimmed : 'India';
    }
}
