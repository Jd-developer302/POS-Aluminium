<?php

namespace App\Support;

final class GlassAreaBillingPairs
{
    /** Square inches in one square foot (12 × 12). */
    public const SQ_INCHES_PER_SQ_FT = 144.0;

    /**
     * @param  array<int, array{width?: float|int|string|null, height?: float|int|string|null, qty?: float|int|string|null}>|null  $pairs
     * @return array<int, array{width: float, height: float, qty: float}>
     */
    public static function normalizeAreaPairsForStorage(?array $pairs): array
    {
        $out = [];
        foreach ($pairs ?? [] as $row) {
            if (! is_array($row)) {
                continue;
            }
            $w = isset($row['width']) ? (float) $row['width'] : 0.0;
            $h = isset($row['height']) ? (float) $row['height'] : 0.0;
            $q = isset($row['qty']) ? (float) $row['qty'] : 0.0;
            $out[] = [
                'width' => round(max(0, $w), 6),
                'height' => round(max(0, $h), 6),
                'qty' => round(max(0, $q), 6),
            ];
        }

        return array_values($out);
    }

    /**
     * @param  array<int, array{width: float, height: float, qty: float}>  $pairs
     */
    public static function totalSqFtFromAreaPairs(array $pairs): float
    {
        $sum = 0.0;
        foreach ($pairs as $row) {
            $w = (float) ($row['width'] ?? 0);
            $h = (float) ($row['height'] ?? 0);
            $q = (float) ($row['qty'] ?? 0);
            $sum += ($w * $h * $q) / self::SQ_INCHES_PER_SQ_FT;
        }

        return round($sum, 4);
    }

    /**
     * Sq ft for a single width × height × qty row.
     */
    public static function sqFtForRow(float $width, float $height, float $qty): float
    {
        return round(($width * $height * $qty) / self::SQ_INCHES_PER_SQ_FT, 4);
    }
}
