<?php

namespace App\Support;

use App\Models\QuotationItem;
use Illuminate\Support\Collection;

/**
 * Expands quotation line items for print/PDF: one table row per length×qty pair
 * for length_ft billing, or per width×height×qty pair for area_sqft; quantity
 * lines remain a single row each.
 */
final class QuotationDisplayRows
{
    /**
     * @param  Collection<int, QuotationItem>|array<int, QuotationItem>  $items
     * @return list<array{
     *     product: string,
     *     variant: string,
     *     length_qty: string,
     *     unit_price: string,
     *     unit_price_note: string,
     *     discount_percent: string,
     *     amount: string,
     *     row_type: string
     * }>
     */
    public static function expand(Collection|array $items): array
    {
        $col = $items instanceof Collection ? $items : collect($items);
        $out = [];

        foreach ($col as $it) {
            $mode = (string) ($it->billing_mode ?? 'quantity');

            if ($mode === 'length_ft') {
                $pairs = self::validLengthPairs($it->length_pairs ?? []);
                if ($pairs !== []) {
                    $out = array_merge($out, self::expandLengthPairs($it, $pairs));

                    continue;
                }
            }

            if ($mode === 'area_sqft') {
                $pairs = self::validAreaPairs($it->length_pairs ?? []);
                if ($pairs !== []) {
                    $out = array_merge($out, self::expandAreaPairs($it, $pairs));

                    continue;
                }
            }

            $out[] = self::singleRow($it);
        }

        return $out;
    }

    /**
     * @param  list<array<string, mixed>>  $pairs
     * @return list<array{
     *     product: string,
     *     variant: string,
     *     length_qty: string,
     *     unit_price: string,
     *     unit_price_note: string,
     *     discount_percent: string,
     *     amount: string,
     *     row_type: string
     * }>
     */
    private static function expandLengthPairs(QuotationItem $it, array $pairs): array
    {
        $rate = (float) $it->unit_price;
        $grossSum = 0.0;
        $discountPct = self::discountPercentLabel($it);
        $out = [];

        foreach ($pairs as $p) {
            $L = (float) ($p['length'] ?? 0);
            $Q = (float) ($p['qty'] ?? 0);
            $gross = round($L * $Q * $rate, 2);
            $grossSum += $gross;

            $out[] = [
                'product' => self::productTitle($it),
                'variant' => self::variantLabel($it),
                'length_qty' => self::fmtFt($L).' ft × '.self::fmtFt($Q),
                'unit_price' => number_format($rate, 2, '.', ','),
                'unit_price_note' => 'Rate/ft',
                'discount_percent' => $discountPct,
                'amount' => number_format($gross, 2, '.', ','),
                'row_type' => 'pair',
            ];
        }

        return array_merge($out, self::adjustmentRows($it, $grossSum, $discountPct));
    }

    /**
     * @param  list<array<string, mixed>>  $pairs
     * @return list<array{
     *     product: string,
     *     variant: string,
     *     length_qty: string,
     *     unit_price: string,
     *     unit_price_note: string,
     *     discount_percent: string,
     *     amount: string,
     *     row_type: string
     * }>
     */
    private static function expandAreaPairs(QuotationItem $it, array $pairs): array
    {
        $rate = (float) $it->unit_price;
        $grossSum = 0.0;
        $discountPct = self::discountPercentLabel($it);
        $out = [];

        foreach ($pairs as $p) {
            $W = (float) ($p['width'] ?? 0);
            $H = (float) ($p['height'] ?? 0);
            $Q = (float) ($p['qty'] ?? 0);
            $sqFt = GlassAreaBillingPairs::sqFtForRow($W, $H, $Q);
            $gross = round($sqFt * $rate, 2);
            $grossSum += $gross;

            $out[] = [
                'product' => self::productTitle($it),
                'variant' => self::variantLabel($it),
                'length_qty' => self::fmtFt($W).' × '.self::fmtFt($H).' in × '.self::fmtFt($Q)
                    .' · '.self::fmtSqFt($sqFt).' sq ft',
                'unit_price' => number_format($rate, 2, '.', ','),
                'unit_price_note' => 'Rate/sqft',
                'discount_percent' => $discountPct,
                'amount' => number_format($gross, 2, '.', ','),
                'row_type' => 'pair',
            ];
        }

        return array_merge($out, self::adjustmentRows($it, $grossSum, $discountPct));
    }

    /**
     * @return list<array{
     *     product: string,
     *     variant: string,
     *     length_qty: string,
     *     unit_price: string,
     *     unit_price_note: string,
     *     discount_percent: string,
     *     amount: string,
     *     row_type: string
     * }>
     */
    private static function adjustmentRows(QuotationItem $it, float $grossSum, string $discountPct): array
    {
        $lineTotal = (float) $it->line_total;
        $delta = round($lineTotal - $grossSum, 2);
        if (abs($delta) < 0.01) {
            return [];
        }

        return [[
            'product' => '—',
            'variant' => '',
            'length_qty' => 'Discount / tax (this line)',
            'unit_price' => '',
            'unit_price_note' => '',
            'discount_percent' => $discountPct !== '0%' ? $discountPct : '—',
            'amount' => number_format($delta, 2, '.', ','),
            'row_type' => 'adjustment',
        ]];
    }

    /**
     * @param  array<int, array<string, mixed>>|null  $pairs
     * @return list<array<string, mixed>>
     */
    private static function validLengthPairs(?array $pairs): array
    {
        if ($pairs === null || $pairs === []) {
            return [];
        }

        $ok = [];
        foreach ($pairs as $p) {
            $L = (float) ($p['length'] ?? 0);
            $Q = (float) ($p['qty'] ?? 0);
            if ($L > 0 && $Q > 0) {
                $ok[] = $p;
            }
        }

        return $ok;
    }

    /**
     * @param  array<int, array<string, mixed>>|null  $pairs
     * @return list<array<string, mixed>>
     */
    private static function validAreaPairs(?array $pairs): array
    {
        if ($pairs === null || $pairs === []) {
            return [];
        }

        $ok = [];
        foreach ($pairs as $p) {
            $W = (float) ($p['width'] ?? 0);
            $H = (float) ($p['height'] ?? 0);
            $Q = (float) ($p['qty'] ?? 0);
            if ($W > 0 && $H > 0 && $Q > 0) {
                $ok[] = $p;
            }
        }

        return $ok;
    }

    private static function singleRow(QuotationItem $it): array
    {
        $mode = (string) ($it->billing_mode ?? 'quantity');
        $qty = (float) $it->quantity;
        $rate = (float) $it->unit_price;
        $lineTotal = (float) $it->line_total;

        $lengthQty = match ($mode) {
            'length_ft' => self::fmtFt($qty).' ft',
            'area_sqft' => self::fmtSqFt($qty).' sq ft',
            default => self::fmtFt($qty),
        };

        $unitPriceNote = match ($mode) {
            'length_ft' => 'Rate/ft',
            'area_sqft' => 'Rate/sqft',
            default => '',
        };

        return [
            'product' => self::productTitle($it),
            'variant' => self::variantLabel($it),
            'length_qty' => $lengthQty,
            'unit_price' => number_format($rate, 2, '.', ','),
            'unit_price_note' => $unitPriceNote,
            'discount_percent' => self::discountPercentLabel($it),
            'amount' => number_format($lineTotal, 2, '.', ','),
            'row_type' => 'single',
        ];
    }

    private static function discountPercentLabel(QuotationItem $it): string
    {
        if ($it->discount_type === 'percent' && (float) $it->discount_value > 0) {
            return self::fmtPct((float) $it->discount_value);
        }

        $discountAmt = (float) $it->discount_amount;
        if ($discountAmt < 0.01) {
            return '0%';
        }

        $gross = (float) $it->subtotal + $discountAmt;
        if ($gross < 0.01) {
            return '—';
        }

        return self::fmtPct($discountAmt / $gross * 100);
    }

    private static function fmtPct(float $pct): string
    {
        $clamped = min(100.0, max(0.0, $pct));
        $s = rtrim(rtrim(number_format($clamped, 2, '.', ''), '0'), '.');

        return ($s === '' ? '0' : $s).'%';
    }

    private static function productTitle(QuotationItem $it): string
    {
        $name = trim((string) ($it->product?->name ?? ''));

        return $name !== '' ? $name : '#'.(string) $it->product_id;
    }

    private static function variantLabel(QuotationItem $it): string
    {
        $pv = $it->relationLoaded('productVarient') ? $it->productVarient : null;
        if ($pv === null) {
            return '';
        }
        $sku = trim((string) ($pv->sku ?? ''));
        $vn = trim((string) ($pv->name ?? ''));
        if ($sku !== '' && $vn !== '') {
            return $sku.' — '.$vn;
        }

        return $sku !== '' ? $sku : ($vn !== '' ? $vn : '');
    }

    private static function fmtFt(float $n): string
    {
        $s = rtrim(rtrim(number_format($n, 4, '.', ''), '0'), '.');

        return $s === '' || $s === '-' ? '0' : $s;
    }

    private static function fmtSqFt(float $n): string
    {
        return self::fmtFt($n);
    }
}
