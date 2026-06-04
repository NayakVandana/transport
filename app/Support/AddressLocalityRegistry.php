<?php

namespace App\Support;

use App\Models\AddressLocality;
use InvalidArgumentException;

class AddressLocalityRegistry
{
    /** @return list<array{value: string, label: string}> */
    public static function options(
        string $level,
        ?string $stateCode = null,
        ?string $district = null,
        ?string $taluka = null,
        ?string $city = null,
    ): array {
        $level = strtolower(trim($level));

        if ($level === 'state') {
            return self::mapOptions(
                AddressLocality::query()
                    ->where('level', 'state')
                    ->whereNull('parent_id')
                    ->orderBy('sort_order')
                    ->orderBy('name')
                    ->get(),
                'state',
            );
        }

        $parentId = self::resolveParentId($level, $stateCode, $district, $taluka, $city);

        if ($parentId === null) {
            return [];
        }

        return self::mapOptions(
            AddressLocality::query()
                ->where('level', $level)
                ->where('parent_id', $parentId)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
            $level,
        );
    }

    private static function resolveParentId(
        string $level,
        ?string $stateCode,
        ?string $district,
        ?string $taluka,
        ?string $city,
    ): ?int {
        $stateCode = trim((string) $stateCode);
        $district = trim((string) $district);
        $taluka = trim((string) $taluka);
        $city = trim((string) $city);

        return match ($level) {
            'district' => $stateCode !== ''
                ? (int) AddressLocality::query()
                    ->where('level', 'state')
                    ->where('state_code', $stateCode)
                    ->value('id')
                : null,
            'taluka' => $district !== '' && $stateCode !== ''
                ? self::childId('district', $stateCode, $district)
                : null,
            'city' => $taluka !== '' && $district !== '' && $stateCode !== ''
                ? self::childId('taluka', $stateCode, $taluka, self::childId('district', $stateCode, $district))
                : null,
            'pincode' => $city !== '' && $taluka !== '' && $district !== '' && $stateCode !== ''
                ? self::childId('city', $stateCode, $city, self::childId('taluka', $stateCode, $taluka, self::childId('district', $stateCode, $district)))
                : null,
            default => throw new InvalidArgumentException('Unsupported address locality level.'),
        };
    }

    private static function childId(string $level, string $stateCode, string $name, ?int $parentId = null): ?int
    {
        $query = AddressLocality::query()
            ->where('level', $level)
            ->where('state_code', $stateCode)
            ->where('name', $name);

        if ($parentId !== null) {
            $query->where('parent_id', $parentId);
        }

        $id = $query->value('id');

        return $id ? (int) $id : null;
    }

    /** @param  \Illuminate\Database\Eloquent\Collection<int, AddressLocality>  $rows */
    private static function mapOptions($rows, string $level): array
    {
        return $rows->map(function (AddressLocality $row) use ($level) {
            if ($level === 'state') {
                return [
                    'value' => (string) $row->state_code,
                    'label' => $row->name.' ('.$row->state_code.')',
                ];
            }

            if ($level === 'pincode') {
                $pincode = (string) ($row->pincode ?: $row->name);

                return [
                    'value' => $pincode,
                    'label' => $pincode,
                ];
            }

            return [
                'value' => $row->name,
                'label' => $row->name,
            ];
        })->values()->all();
    }
}
