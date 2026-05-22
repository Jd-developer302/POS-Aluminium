<?php

namespace App\Support;

use App\Models\PurchaseOrderItem;
use Illuminate\Support\Collection;

/**
 * Expands purchase order line items for email/PDF: one row per length×qty pair
 * for length_ft billing; quantity lines remain a single row each.
 */
final class PurchaseOrderDisplayRows
{
    /**
     * @param  Collection<int, PurchaseOrderItem>|array<int, PurchaseOrderItem>  $items
     * @return list<array{
     *     product: string,
     *     variant: string,
     *     length_qty: string,
     *     unit_cost: string,
     *     unit_cost_note: string,
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
            $pairs = self::validLengthPairs($it->length_pairs ?? []);

            if ($mode !== 'length_ft' || $pairs === []) {
                $out[] = self::singleRow($it);

                continue;
            }

            $rate = (float) $it->unit_cost;
            $grossSum = 0.0;
            $discountPct = self::discountPercentLabel($it);

            foreach ($pairs as $p) {
                $L = (float) ($p['length'] ?? 0);
                $Q = (float) ($p['qty'] ?? 0);
                $gross = round($L * $Q * $rate, 2);
                $grossSum += $gross;

                $out[] = [
                    'product' => self::productTitle($it),
                    'variant' => self::variantLabel($it),
                    'length_qty' => self::fmtQty($L).' ft × '.self::fmtQty($Q),
                    'unit_cost' => number_format($rate, 2, '.', ','),
                    'unit_cost_note' => 'Cost/ft',
                    'discount_percent' => $discountPct,
                    'amount' => number_format($gross, 2, '.', ','),
                    'row_type' => 'pair',
                ];
            }

            $lineTotal = (float) $it->subtotal;
            $delta = round($lineTotal - $grossSum, 2);
            if (abs($delta) >= 0.01) {
                $out[] = [
                    'product' => '—',
                    'variant' => '',
                    'length_qty' => 'Discount / tax (this line)',
                    'unit_cost' => '',
                    'unit_cost_note' => '',
                    'discount_percent' => $discountPct !== '0%' ? $discountPct : '—',
                    'amount' => number_format($delta, 2, '.', ','),
                    'row_type' => 'adjustment',
                ];
            }
        }

        return $out;
    }

    /**
     * @param  Collection<int, PurchaseOrderItem>|array<int, PurchaseOrderItem>  $items
     */
    public static function hasLengthBilling(Collection|array $items): bool
    {
        $col = $items instanceof Collection ? $items : collect($items);

        return $col->contains(
            static fn (PurchaseOrderItem $it): bool => ($it->billing_mode ?? 'quantity') === 'length_ft'
        );
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

    private static function singleRow(PurchaseOrderItem $it): array
    {
        $mode = (string) ($it->billing_mode ?? 'quantity');
        $qty = (float) $it->quantity;
        $rate = (float) $it->unit_cost;
        $lineTotal = (float) $it->subtotal;

        $lengthQty = $mode === 'length_ft'
            ? self::fmtQty($qty).' ft'
            : self::fmtQty($qty);

        return [
            'product' => self::productTitle($it),
            'variant' => self::variantLabel($it),
            'length_qty' => $lengthQty,
            'unit_cost' => number_format($rate, 2, '.', ','),
            'unit_cost_note' => $mode === 'length_ft' ? 'Cost/ft' : '',
            'discount_percent' => self::discountPercentLabel($it),
            'amount' => number_format($lineTotal, 2, '.', ','),
            'row_type' => 'single',
        ];
    }

    private static function discountPercentLabel(PurchaseOrderItem $it): string
    {
        $discountAmt = (float) $it->discount;
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

    private static function productTitle(PurchaseOrderItem $it): string
    {
        $name = trim((string) ($it->product?->name ?? ''));

        return $name !== '' ? $name : '#'.(string) $it->product_id;
    }

    private static function variantLabel(PurchaseOrderItem $it): string
    {
        $pv = $it->relationLoaded('productVarient') ? $it->productVarient : null;
        if ($pv === null) {
            return '—';
        }
        $sku = trim((string) ($pv->sku ?? ''));
        $vn = trim((string) ($pv->name ?? ''));
        if ($sku !== '' && $vn !== '') {
            return $sku.' — '.$vn;
        }

        return $sku !== '' ? $sku : ($vn !== '' ? $vn : '—');
    }

    private static function fmtQty(float $n): string
    {
        $s = rtrim(rtrim(number_format($n, 4, '.', ''), '0'), '.');

        return $s === '' || $s === '-' ? '0' : $s;
    }
}
