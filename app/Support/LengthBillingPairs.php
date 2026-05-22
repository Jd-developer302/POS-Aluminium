<?php

namespace App\Support;

final class LengthBillingPairs
{
    /**
     * @param  array<int, array{length?: float|int|string|null, qty?: float|int|string|null}>|null  $pairs
     * @return array<int, array{length: float, qty: float}>
     */
    public static function normalizeLengthPairsForStorage(?array $pairs): array
    {
        $out = [];
        foreach ($pairs ?? [] as $row) {
            if (! is_array($row)) {
                continue;
            }
            $l = isset($row['length']) ? (float) $row['length'] : 0.0;
            $q = isset($row['qty']) ? (float) $row['qty'] : 0.0;
            $out[] = [
                'length' => round(max(0, $l), 6),
                'qty' => round(max(0, $q), 6),
            ];
        }

        return array_values($out);
    }

    /**
     * @param  array<int, array{length: float, qty: float}>  $pairs
     */
    public static function totalFeetFromLengthPairs(array $pairs): float
    {
        $sum = 0.0;
        foreach ($pairs as $row) {
            $sum += (float) ($row['length'] ?? 0) * (float) ($row['qty'] ?? 0);
        }

        return round($sum, 4);
    }
}
