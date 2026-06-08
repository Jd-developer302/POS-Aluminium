<?php

namespace App\Support;

final class BillingLineResolver
{
    public static function normalizeMode(?string $mode): string
    {
        return match ($mode) {
            'length_ft' => 'length_ft',
            'area_sqft' => 'area_sqft',
            default => 'quantity',
        };
    }

    /**
     * @return list<string>
     */
    public static function allowedModes(): array
    {
        return ['quantity', 'length_ft', 'area_sqft'];
    }

    /**
     * Validate a sale / quotation line. Returns user-facing error or null.
     *
     * @param  array<string, mixed>  $it
     */
    public static function validateSaleQuotationItem(array $it): ?string
    {
        $mode = self::normalizeMode($it['billing_mode'] ?? null);

        if ($mode === 'length_ft') {
            $pairs = LengthBillingPairs::normalizeLengthPairsForStorage(
                is_array($it['length_pairs'] ?? null) ? $it['length_pairs'] : []
            );
            if (LengthBillingPairs::totalFeetFromLengthPairs($pairs) <= 0) {
                return 'Length billing: total feet must be greater than zero (check length × qty rows).';
            }
            $rate = (float) ($it['rate_per_ft'] ?? $it['unit_price'] ?? 0);
            if ($rate <= 0) {
                return 'Length billing: rate per ft must be greater than zero.';
            }

            return null;
        }

        if ($mode === 'area_sqft') {
            $pairs = GlassAreaBillingPairs::normalizeAreaPairsForStorage(
                is_array($it['length_pairs'] ?? null) ? $it['length_pairs'] : []
            );
            if (GlassAreaBillingPairs::totalSqFtFromAreaPairs($pairs) <= 0) {
                return 'Glass area billing: total sq ft must be greater than zero (check width × height × qty rows).';
            }
            $rate = (float) ($it['rate_per_sqft'] ?? $it['unit_price'] ?? 0);
            if ($rate <= 0) {
                return 'Glass area billing: rate per sq ft must be greater than zero.';
            }

            return null;
        }

        if ((float) ($it['quantity'] ?? 0) < 0.0001) {
            return 'Each line must have a quantity greater than zero (or use length / glass area billing).';
        }

        return null;
    }

    /**
     * Validate a purchase line. Returns user-facing error or null.
     *
     * @param  array<string, mixed>  $row
     */
    public static function validatePurchaseItem(array $row): ?string
    {
        $mode = self::normalizeMode($row['billing_mode'] ?? null);

        if ($mode === 'length_ft') {
            $pairs = LengthBillingPairs::normalizeLengthPairsForStorage(
                is_array($row['length_pairs'] ?? null) ? $row['length_pairs'] : []
            );
            if (LengthBillingPairs::totalFeetFromLengthPairs($pairs) <= 0) {
                return 'Length billing: total feet must be greater than zero.';
            }
            if ((float) ($row['unit_cost'] ?? 0) <= 0) {
                return 'Length billing: cost per ft must be greater than zero.';
            }

            return null;
        }

        if ($mode === 'area_sqft') {
            $pairs = GlassAreaBillingPairs::normalizeAreaPairsForStorage(
                is_array($row['length_pairs'] ?? null) ? $row['length_pairs'] : []
            );
            if (GlassAreaBillingPairs::totalSqFtFromAreaPairs($pairs) <= 0) {
                return 'Glass area billing: total sq ft must be greater than zero.';
            }
            if ((float) ($row['unit_cost'] ?? 0) <= 0) {
                return 'Glass area billing: cost per sq ft must be greater than zero.';
            }

            return null;
        }

        if ((float) ($row['quantity'] ?? 0) < 0.0001) {
            return 'Quantity must be greater than zero.';
        }

        return null;
    }

    /**
     * Resolve sale / quotation line amounts.
     *
     * @param  array<string, mixed>  $it
     * @return array{
     *     billing_mode: string,
     *     length_pairs: array<int, array<string, float>>|null,
     *     quantity: float,
     *     unit_price: float,
     *     line_subtotal: float,
     *     discount_amount: float,
     *     discount_type: string|null,
     *     discount_value: float
     * }
     */
    public static function resolveSaleQuotationLine(array $it): array
    {
        $mode = self::normalizeMode($it['billing_mode'] ?? null);

        if ($mode === 'length_ft') {
            $pairs = is_array($it['length_pairs'] ?? null) ? $it['length_pairs'] : [];
            $normalizedPairs = LengthBillingPairs::normalizeLengthPairsForStorage($pairs);
            $totalFt = LengthBillingPairs::totalFeetFromLengthPairs($normalizedPairs);
            $rate = round((float) ($it['rate_per_ft'] ?? $it['unit_price'] ?? 0), 2);
            $gross = round($totalFt * $rate, 2);
            $pct = isset($it['discount_percent']) ? (float) $it['discount_percent'] : 0.0;
            $pct = min(100.0, max(0.0, $pct));
            $lineDiscountAmt = round($gross * $pct / 100, 2);

            return [
                'billing_mode' => 'length_ft',
                'length_pairs' => $normalizedPairs,
                'quantity' => $totalFt,
                'unit_price' => $rate,
                'line_subtotal' => round(max(0.0, $gross - $lineDiscountAmt), 2),
                'discount_amount' => $lineDiscountAmt,
                'discount_type' => $pct > 0 ? 'percent' : null,
                'discount_value' => $pct,
            ];
        }

        if ($mode === 'area_sqft') {
            $pairs = is_array($it['length_pairs'] ?? null) ? $it['length_pairs'] : [];
            $normalizedPairs = GlassAreaBillingPairs::normalizeAreaPairsForStorage($pairs);
            $totalSqFt = GlassAreaBillingPairs::totalSqFtFromAreaPairs($normalizedPairs);
            $rate = round((float) ($it['rate_per_sqft'] ?? $it['unit_price'] ?? 0), 2);
            $gross = round($totalSqFt * $rate, 2);
            $pct = isset($it['discount_percent']) ? (float) $it['discount_percent'] : 0.0;
            $pct = min(100.0, max(0.0, $pct));
            $lineDiscountAmt = round($gross * $pct / 100, 2);

            return [
                'billing_mode' => 'area_sqft',
                'length_pairs' => $normalizedPairs,
                'quantity' => $totalSqFt,
                'unit_price' => $rate,
                'line_subtotal' => round(max(0.0, $gross - $lineDiscountAmt), 2),
                'discount_amount' => $lineDiscountAmt,
                'discount_type' => $pct > 0 ? 'percent' : null,
                'discount_value' => $pct,
            ];
        }

        $qty = (float) ($it['quantity'] ?? 0);
        $unitPrice = (float) ($it['unit_price'] ?? 0);

        return [
            'billing_mode' => 'quantity',
            'length_pairs' => null,
            'quantity' => $qty,
            'unit_price' => $unitPrice,
            'line_subtotal' => round($qty * $unitPrice, 2),
            'discount_amount' => 0.0,
            'discount_type' => null,
            'discount_value' => 0.0,
        ];
    }

    /**
     * Resolve purchase order / invoice line amounts.
     *
     * @param  array<string, mixed>  $row
     * @return array{
     *     billing_mode: string,
     *     length_pairs: array<int, array<string, float>>|null,
     *     quantity: float,
     *     unit_cost: float,
     *     base: float
     * }
     */
    public static function resolvePurchaseLine(array $row): array
    {
        $mode = self::normalizeMode($row['billing_mode'] ?? null);
        $lineDisc = (float) ($row['discount'] ?? 0);

        if ($mode === 'length_ft') {
            $pairs = is_array($row['length_pairs'] ?? null) ? $row['length_pairs'] : [];
            $normalizedPairs = LengthBillingPairs::normalizeLengthPairsForStorage($pairs);
            $totalFt = LengthBillingPairs::totalFeetFromLengthPairs($normalizedPairs);
            $rate = round((float) ($row['unit_cost'] ?? 0), 2);
            $gross = round($totalFt * $rate, 2);

            return [
                'billing_mode' => 'length_ft',
                'length_pairs' => $normalizedPairs,
                'quantity' => $totalFt,
                'unit_cost' => $rate,
                'base' => round(max(0.0, $gross - $lineDisc), 2),
            ];
        }

        if ($mode === 'area_sqft') {
            $pairs = is_array($row['length_pairs'] ?? null) ? $row['length_pairs'] : [];
            $normalizedPairs = GlassAreaBillingPairs::normalizeAreaPairsForStorage($pairs);
            $totalSqFt = GlassAreaBillingPairs::totalSqFtFromAreaPairs($normalizedPairs);
            $rate = round((float) ($row['unit_cost'] ?? 0), 2);
            $gross = round($totalSqFt * $rate, 2);

            return [
                'billing_mode' => 'area_sqft',
                'length_pairs' => $normalizedPairs,
                'quantity' => $totalSqFt,
                'unit_cost' => $rate,
                'base' => round(max(0.0, $gross - $lineDisc), 2),
            ];
        }

        $qty = (float) ($row['quantity'] ?? 0);
        $unitCost = (float) ($row['unit_cost'] ?? 0);

        return [
            'billing_mode' => 'quantity',
            'length_pairs' => null,
            'quantity' => $qty,
            'unit_cost' => $unitCost,
            'base' => round($qty * $unitCost - $lineDisc, 2),
        ];
    }

    /**
     * Resolve stock row quantity from billing mode and pairs.
     *
     * @param  array<string, mixed>  $data
     * @return array{billing_mode: string, length_pairs: array<int, array<string, float>>|null, quantity: float}
     */
    public static function resolveStockRow(array $data): array
    {
        $mode = self::normalizeMode($data['billing_mode'] ?? null);

        if ($mode === 'length_ft') {
            $pairsRaw = is_array($data['length_pairs'] ?? null) ? $data['length_pairs'] : [];
            $normalizedPairs = LengthBillingPairs::normalizeLengthPairsForStorage($pairsRaw);
            $totalFt = LengthBillingPairs::totalFeetFromLengthPairs($normalizedPairs);

            return [
                'billing_mode' => 'length_ft',
                'length_pairs' => $normalizedPairs,
                'quantity' => $totalFt,
            ];
        }

        if ($mode === 'area_sqft') {
            $pairsRaw = is_array($data['length_pairs'] ?? null) ? $data['length_pairs'] : [];
            $normalizedPairs = GlassAreaBillingPairs::normalizeAreaPairsForStorage($pairsRaw);
            $totalSqFt = GlassAreaBillingPairs::totalSqFtFromAreaPairs($normalizedPairs);

            return [
                'billing_mode' => 'area_sqft',
                'length_pairs' => $normalizedPairs,
                'quantity' => $totalSqFt,
            ];
        }

        return [
            'billing_mode' => 'quantity',
            'length_pairs' => null,
            'quantity' => (float) ($data['quantity'] ?? 0),
        ];
    }
}
