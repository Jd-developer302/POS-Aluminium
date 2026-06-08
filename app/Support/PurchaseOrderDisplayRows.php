<?php

namespace App\Support;

use App\Models\Product\Product;
use App\Models\Product\ProductVarient;
use App\Models\PurchaseInvoiceItem;
use App\Models\PurchaseOrderItem;
use Illuminate\Support\Collection;

/**
 * Expands purchase order line items for email/PDF: one row per length×qty pair
 * for length_ft billing, or per width×height×qty pair for area_sqft; quantity
 * lines remain a single row each.
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
     * @param  Collection<int, PurchaseOrderItem>|array<int, PurchaseOrderItem>  $items
     */
    public static function hasLengthBilling(Collection|array $items): bool
    {
        $col = $items instanceof Collection ? $items : collect($items);

        return $col->contains(
            static fn (PurchaseOrderItem $it): bool => in_array(
                (string) ($it->billing_mode ?? 'quantity'),
                ['length_ft', 'area_sqft'],
                true
            )
        );
    }

    /**
     * @param  list<array<string, mixed>>  $pairs
     * @return list<array<string, mixed>>
     */
    private static function expandLengthPairs(PurchaseOrderItem $it, array $pairs): array
    {
        $rate = (float) $it->unit_cost;
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
                'length_qty' => self::fmtQty($L).' ft × '.self::fmtQty($Q),
                'unit_cost' => number_format($rate, 2, '.', ','),
                'unit_cost_note' => 'Cost/ft',
                'discount_percent' => $discountPct,
                'amount' => number_format($gross, 2, '.', ','),
                'row_type' => 'pair',
            ];
        }

        return array_merge($out, self::adjustmentRows($it, $grossSum, $discountPct));
    }

    /**
     * @param  list<array<string, mixed>>  $pairs
     * @return list<array<string, mixed>>
     */
    private static function expandAreaPairs(PurchaseOrderItem $it, array $pairs): array
    {
        $rate = (float) $it->unit_cost;
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
                'length_qty' => self::fmtQty($W).' × '.self::fmtQty($H).' in × '.self::fmtQty($Q)
                    .' · '.self::fmtSqFt($sqFt).' sq ft',
                'unit_cost' => number_format($rate, 2, '.', ','),
                'unit_cost_note' => 'Cost/sqft',
                'discount_percent' => $discountPct,
                'amount' => number_format($gross, 2, '.', ','),
                'row_type' => 'pair',
            ];
        }

        return array_merge($out, self::adjustmentRows($it, $grossSum, $discountPct));
    }

    /**
     * @return list<array<string, mixed>>
     */
    private static function adjustmentRows(PurchaseOrderItem $it, float $grossSum, string $discountPct): array
    {
        $lineTotal = (float) $it->subtotal;
        $delta = round($lineTotal - $grossSum, 2);
        if (abs($delta) < 0.01) {
            return [];
        }

        return [[
            'product' => '—',
            'variant' => '',
            'length_qty' => 'Discount / tax (this line)',
            'unit_cost' => '',
            'unit_cost_note' => '',
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

    private static function singleRow(PurchaseOrderItem $it): array
    {
        $mode = (string) ($it->billing_mode ?? 'quantity');
        $qty = (float) $it->quantity;
        $rate = (float) $it->unit_cost;
        $lineTotal = (float) $it->subtotal;

        $lengthQty = match ($mode) {
            'length_ft' => self::fmtQty($qty).' ft',
            'area_sqft' => self::fmtSqFt($qty).' sq ft',
            default => self::fmtQty($qty),
        };

        $unitCostNote = match ($mode) {
            'length_ft' => 'Cost/ft',
            'area_sqft' => 'Cost/sqft',
            default => '',
        };

        return [
            'product' => self::productTitle($it),
            'variant' => self::variantLabel($it),
            'length_qty' => $lengthQty,
            'unit_cost' => number_format($rate, 2, '.', ','),
            'unit_cost_note' => $unitCostNote,
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

    /**
     * @param  PurchaseOrderItem|PurchaseInvoiceItem  $it
     */
    public static function variantLabel(PurchaseOrderItem|PurchaseInvoiceItem $it): string
    {
        $pv = $it->relationLoaded('productVarient') ? $it->productVarient : null;
        if ($pv === null && $it->product_variant_id) {
            $pv = ProductVarient::query()->find($it->product_variant_id);
        }
        if ($pv === null && $it->product_id) {
            $pv = self::fallbackVariantForProduct((int) $it->product_id);
        }

        return self::formatVariantLabel($pv);
    }

    /**
     * @param  array<string, mixed>  $row
     */
    public static function resolveLineVariantId(array $row): ?int
    {
        if (! empty($row['product_variant_id'])) {
            return (int) $row['product_variant_id'];
        }

        $productId = (int) ($row['product_id'] ?? 0);
        if ($productId <= 0) {
            return null;
        }

        $product = Product::query()->find($productId, ['id', 'type']);
        if (! $product || $product->type !== 'simple') {
            return null;
        }

        $variantIds = ProductVarient::query()
            ->where('product_id', $productId)
            ->where('status', 'active')
            ->orderBy('id')
            ->pluck('id');

        return $variantIds->count() === 1 ? (int) $variantIds->first() : null;
    }

    private static function fallbackVariantForProduct(int $productId): ?ProductVarient
    {
        $type = Product::query()->whereKey($productId)->value('type');
        if ($type !== 'simple') {
            return null;
        }

        $variants = ProductVarient::query()
            ->where('product_id', $productId)
            ->where('status', 'active')
            ->orderBy('id')
            ->get(['id', 'sku', 'name']);

        return $variants->count() === 1 ? $variants->first() : null;
    }

    private static function formatVariantLabel(?ProductVarient $pv): string
    {
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

    private static function fmtSqFt(float $n): string
    {
        return self::fmtQty($n);
    }
}
