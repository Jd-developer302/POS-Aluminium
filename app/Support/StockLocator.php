<?php

namespace App\Support;

use App\Models\Product\Product;
use App\Models\Stock;
use RuntimeException;

class StockLocator
{
    /**
     * Find a stock row for sale / inventory operations.
     * When variant id is null, matches rows with null variant or a single variant-specific row in the warehouse.
     */
    public static function findLocked(int $warehouseId, int $productId, ?int $variantId): ?Stock
    {
        if ($variantId !== null) {
            return Stock::query()
                ->where('warehouse_id', $warehouseId)
                ->where('product_id', $productId)
                ->where('product_variant_id', $variantId)
                ->lockForUpdate()
                ->first();
        }

        $nullRow = Stock::query()
            ->where('warehouse_id', $warehouseId)
            ->where('product_id', $productId)
            ->whereNull('product_variant_id')
            ->lockForUpdate()
            ->first();

        if ($nullRow) {
            return $nullRow;
        }

        $variantRows = Stock::query()
            ->where('warehouse_id', $warehouseId)
            ->where('product_id', $productId)
            ->whereNotNull('product_variant_id')
            ->lockForUpdate()
            ->get();

        if ($variantRows->count() === 1) {
            return $variantRows->first();
        }

        return null;
    }

    public static function findLockedOrFail(int $warehouseId, int $productId, ?int $variantId): Stock
    {
        $stock = self::findLocked($warehouseId, $productId, $variantId);

        if ($stock) {
            return $stock;
        }

        $productName = Product::query()->whereKey($productId)->value('name') ?? ('Product #'.$productId);

        if ($variantId === null) {
            $variantRowCount = Stock::query()
                ->where('warehouse_id', $warehouseId)
                ->where('product_id', $productId)
                ->whereNotNull('product_variant_id')
                ->count();

            if ($variantRowCount > 1) {
                throw new RuntimeException(
                    'Stock for “'.$productName.'” is stored per variant in this warehouse. Edit the sale and select the matching variant (SKU) on each line, then try again.'
                );
            }
        }

        throw new RuntimeException(
            'No stock record for “'.$productName.'” in this warehouse. Receive or transfer stock first.'
        );
    }
}
