<?php

namespace App\Support;

use App\Models\InventoryMovement;
use App\Models\PurchaseInvoiceItem;
use App\Models\SaleItem;
use App\Models\SaleReturnItem;
use App\Models\Stock;
use App\Models\StockTransferItem;
use Illuminate\Support\Collection;

class InventoryMovementPresenter
{
    /**
     * @param  Collection<int, InventoryMovement>  $movements
     * @return array<string, string>
     */
    public static function stockBillingModeMap(Collection $movements): array
    {
        if ($movements->isEmpty()) {
            return [];
        }

        $warehouseIds = $movements->pluck('warehouse_id')->filter()->unique()->values()->all();
        $productIds = $movements->pluck('product_id')->filter()->unique()->values()->all();

        if ($warehouseIds === [] || $productIds === []) {
            return [];
        }

        $map = [];
        Stock::query()
            ->whereIn('warehouse_id', $warehouseIds)
            ->whereIn('product_id', $productIds)
            ->get(['warehouse_id', 'product_id', 'product_variant_id', 'billing_mode'])
            ->each(static function (Stock $s) use (&$map): void {
                $key = self::stockKey((int) $s->warehouse_id, (int) $s->product_id, $s->product_variant_id);
                $map[$key] = (string) ($s->billing_mode ?? 'quantity');
            });

        return $map;
    }

    /**
     * @param  array<string, string>  $stockBillingMap
     * @return array<string, mixed>
     */
    public static function present(InventoryMovement $movement, array $stockBillingMap = []): array
    {
        $stockKey = self::stockKey(
            (int) ($movement->warehouse_id ?? 0),
            (int) $movement->product_id,
            $movement->product_variant_id,
        );
        $billing = (string) ($movement->billing_mode
            ?? $stockBillingMap[$stockKey]
            ?? 'quantity');

        $pairs = is_array($movement->length_pairs) ? $movement->length_pairs : null;
        if ($pairs === null || $pairs === []) {
            $pairs = self::resolvePairsFromSource($movement);
        }

        if ($billing === 'quantity' && is_array($pairs) && $pairs !== []) {
            $first = $pairs[0] ?? null;
            if (is_array($first)) {
                if (array_key_exists('width', $first) || array_key_exists('height', $first)) {
                    $billing = 'area_sqft';
                } elseif (array_key_exists('length', $first)) {
                    $billing = 'length_ft';
                }
            }
        }

        $cuts = self::cutsSummary($billing, $pairs, (float) $movement->quantity);

        return [
            'billing_mode' => $billing,
            'cuts_summary' => $cuts,
            'quantity_label' => self::qtyLabel($billing, (float) $movement->quantity),
            'before_qty_label' => self::qtyLabel($billing, (float) $movement->before_qty),
            'after_qty_label' => self::qtyLabel($billing, (float) $movement->after_qty),
        ];
    }

    private static function stockKey(int $warehouseId, int $productId, mixed $variantId): string
    {
        return $warehouseId.'|'.$productId.'|'.($variantId ?? '0');
    }

    /**
     * @param  array<int, mixed>|null  $pairs
     */
    private static function cutsSummary(string $billing, ?array $pairs, float $quantity): string
    {
        if ($billing === 'area_sqft') {
            $summary = self::areaPairsSummary($pairs);
            if ($summary !== '—') {
                return $summary;
            }
            if ($quantity > 0) {
                return self::formatQty($quantity).' sq ft';
            }

            return '—';
        }

        if ($billing === 'length_ft') {
            $summary = self::lengthPairsSummary($pairs);
            if ($summary !== '—') {
                return $summary;
            }
            if ($quantity > 0) {
                return self::formatQty($quantity).'×1';
            }

            return '—';
        }

        return '—';
    }

  /**
     * @param  array<int, mixed>|null  $pairs
     */
    private static function lengthPairsSummary(?array $pairs): string
    {
        if (! is_array($pairs) || $pairs === []) {
            return '—';
        }
        $parts = [];
        foreach ($pairs as $row) {
            if (! is_array($row)) {
                continue;
            }
            $l = (float) ($row['length'] ?? $row['l'] ?? 0);
            $q = (float) ($row['qty'] ?? $row['q'] ?? 0);
            if ($l <= 0 && $q <= 0) {
                continue;
            }
            $parts[] = self::formatQty($l).'×'.self::formatQty($q);
        }

        return $parts !== [] ? implode(' + ', $parts) : '—';
    }

    /**
     * @param  array<int, mixed>|null  $pairs
     */
    private static function areaPairsSummary(?array $pairs): string
    {
        if (! is_array($pairs) || $pairs === []) {
            return '—';
        }
        $parts = [];
        foreach ($pairs as $row) {
            if (! is_array($row)) {
                continue;
            }
            $w = (float) ($row['width'] ?? 0);
            $h = (float) ($row['height'] ?? 0);
            $q = (float) ($row['qty'] ?? 0);
            if ($w <= 0 && $h <= 0 && $q <= 0) {
                continue;
            }
            $parts[] = self::formatQty($w).'×'.self::formatQty($h).'×'.self::formatQty($q);
        }

        return $parts !== [] ? implode(' + ', $parts) : '—';
    }

    private static function qtyLabel(string $billing, float $quantity): string
    {
        $formatted = self::formatQty($quantity);
        if ($billing === 'area_sqft') {
            return $formatted.' sq ft';
        }
        if ($billing === 'length_ft') {
            return $formatted.' ft';
        }

        return $formatted;
    }

    private static function formatQty(float $value): string
    {
        $s = number_format($value, 4, '.', '');
        $s = rtrim(rtrim($s, '0'), '.');

        return $s === '' ? '0' : $s;
    }

    /**
     * @return array<int, mixed>|null
     */
    private static function resolvePairsFromSource(InventoryMovement $movement): ?array
    {
        $sourceType = (string) $movement->source_type;
        $sourceId = $movement->source_id;
        if ($sourceId === null) {
            return null;
        }

        if ($sourceType === 'sale') {
            $item = SaleItem::query()
                ->where('sale_id', (int) $sourceId)
                ->where('product_id', (int) $movement->product_id)
                ->when(
                    $movement->product_variant_id,
                    fn ($q) => $q->where('product_variant_id', (int) $movement->product_variant_id),
                    fn ($q) => $q->whereNull('product_variant_id'),
                )
                ->first(['length_pairs']);

            $pairs = $item?->length_pairs;

            return is_array($pairs) && $pairs !== [] ? $pairs : null;
        }

        if ($sourceType === 'sale_return') {
            $returnItem = SaleReturnItem::query()
                ->where('sale_return_id', (int) $sourceId)
                ->where('product_id', (int) $movement->product_id)
                ->when(
                    $movement->product_variant_id,
                    fn ($q) => $q->where('product_variant_id', (int) $movement->product_variant_id),
                    fn ($q) => $q->whereNull('product_variant_id'),
                )
                ->first(['sale_item_id']);

            if ($returnItem?->sale_item_id) {
                $saleItem = SaleItem::query()->find($returnItem->sale_item_id, ['length_pairs']);
                $pairs = $saleItem?->length_pairs;
                if (is_array($pairs) && $pairs !== []) {
                    return $pairs;
                }
            }

            $item = SaleItem::query()
                ->where('sale_id', (int) $sourceId)
                ->where('product_id', (int) $movement->product_id)
                ->when(
                    $movement->product_variant_id,
                    fn ($q) => $q->where('product_variant_id', (int) $movement->product_variant_id),
                    fn ($q) => $q->whereNull('product_variant_id'),
                )
                ->first(['length_pairs']);

            $pairs = $item?->length_pairs;

            return is_array($pairs) && $pairs !== [] ? $pairs : null;
        }

        if ($sourceType === 'purchase_invoice') {
            $item = PurchaseInvoiceItem::query()
                ->where('purchase_invoice_id', (int) $sourceId)
                ->where('product_id', (int) $movement->product_id)
                ->when(
                    $movement->product_variant_id,
                    fn ($q) => $q->where('product_variant_id', (int) $movement->product_variant_id),
                    fn ($q) => $q->whereNull('product_variant_id'),
                )
                ->first(['length_pairs']);

            $pairs = $item?->length_pairs;

            return is_array($pairs) && $pairs !== [] ? $pairs : null;
        }

        if ($sourceType === 'stock_transfer') {
            $item = StockTransferItem::query()
                ->where('stock_transfer_id', (int) $sourceId)
                ->where('product_id', (int) $movement->product_id)
                ->when(
                    $movement->product_variant_id,
                    fn ($q) => $q->where('product_variant_id', (int) $movement->product_variant_id),
                    fn ($q) => $q->whereNull('product_variant_id'),
                )
                ->first(['length_pairs']);

            $pairs = $item?->length_pairs;

            return is_array($pairs) && $pairs !== [] ? $pairs : null;
        }

        return null;
    }
}
