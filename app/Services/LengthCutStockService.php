<?php

namespace App\Services;

use App\Models\BranchProduct;
use App\Models\InventoryMovement;
use App\Models\PurchaseInvoice;
use App\Models\PurchaseInvoiceItem;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Stock;
use App\Models\StockLengthItem;
use App\Support\LengthBillingPairs;
use App\Support\StockLocator;
use RuntimeException;

/**
 * Cut-length (rod / offcut) inventory: physical {@see StockLengthItem} rows per {@see Stock}.
 * Billing mode {@see Stock::$billing_mode} uses {@code length_ft} (same as sale / purchase lines).
 */
final class LengthCutStockService
{
    /**
     * Replace all length items from the stock's {@see Stock::$length_pairs} snapshot (merged by length).
     */
    public function syncLengthItemsFromStockLengthPairs(Stock $stock): void
    {
        if (($stock->billing_mode ?? 'quantity') !== 'length_ft') {
            StockLengthItem::query()->where('stock_id', $stock->id)->delete();

            return;
        }

        $norm = LengthBillingPairs::normalizeLengthPairsForStorage(
            is_array($stock->length_pairs) ? $stock->length_pairs : []
        );
        $merged = $this->mergePairsByLength($norm);

        StockLengthItem::query()->where('stock_id', $stock->id)->delete();
        foreach ($merged as $row) {
            StockLengthItem::query()->create([
                'stock_id' => $stock->id,
                'length' => $row['length'],
                'qty' => $row['qty'],
                'status' => 'available',
            ]);
        }

        $this->recomputeStockTotals($stock);
    }

    /**
     * If a length_ft stock row has no {@see StockLengthItem} rows yet, build them from
     * {@see Stock::$length_pairs} or a single line from total {@see Stock::$quantity} (legacy data).
     */
    public function ensureLengthItemsFromLegacyStockRow(Stock $stock): void
    {
        if (($stock->billing_mode ?? 'quantity') !== 'length_ft') {
            return;
        }

        if (StockLengthItem::query()->where('stock_id', $stock->id)->exists()) {
            return;
        }

        $pairs = LengthBillingPairs::normalizeLengthPairsForStorage(
            is_array($stock->length_pairs) ? $stock->length_pairs : []
        );

        if ($pairs !== []) {
            foreach ($this->mergePairsByLength($pairs) as $row) {
                StockLengthItem::query()->create([
                    'stock_id' => $stock->id,
                    'length' => $row['length'],
                    'qty' => $row['qty'],
                    'status' => 'available',
                ]);
            }
            $this->recomputeStockTotals($stock);

            return;
        }

        $ft = round((float) $stock->quantity, 4);
        if ($ft <= 0) {
            return;
        }

        StockLengthItem::query()->create([
            'stock_id' => $stock->id,
            'length' => $ft,
            'qty' => 1,
            'status' => 'available',
        ]);
        $this->recomputeStockTotals($stock);
    }

    /**
     * Receive a length_ft purchase line: physical rods + stock quantity + movement + branch (no double increment).
     */
    public function receiveLengthPurchaseLine(
        PurchaseInvoice $invoice,
        PurchaseInvoiceItem $item,
        ?int $createdBy,
        ?string $notes = null,
    ): void {
        $pairs = LengthBillingPairs::normalizeLengthPairsForStorage(
            is_array($item->length_pairs) ? $item->length_pairs : []
        );
        if ($pairs === []) {
            return;
        }

        $ft = LengthBillingPairs::totalFeetFromLengthPairs($pairs);
        if ($ft <= 0) {
            return;
        }

        /** @var Stock $stock */
        $stock = Stock::query()->firstOrNew(
            [
                'warehouse_id' => $invoice->warehouse_id,
                'product_id' => $item->product_id,
                'product_variant_id' => $item->product_variant_id,
            ],
            [
                'quantity' => 0,
                'reserved_quantity' => 0,
                'status' => 'active',
                'billing_mode' => 'length_ft',
                'length_pairs' => [],
            ]
        );

        if ($stock->exists && ($stock->billing_mode ?? 'quantity') === 'quantity') {
            throw new RuntimeException(
                'Cannot receive length rods onto a quantity-mode stock row for this product/warehouse. Convert stock to length_ft first.'
            );
        }

        $stock->billing_mode = 'length_ft';
        $stock->save();

        $stock = Stock::query()->whereKey($stock->id)->lockForUpdate()->firstOrFail();
        $before = (float) $stock->quantity;

        foreach ($this->mergePairsByLength($pairs) as $row) {
            $this->mergeAvailableLength($stock, $row['length'], $row['qty']);
        }

        $this->recomputeStockTotals($stock);
        $after = (float) $stock->fresh()->quantity;
        $delta = round(max(0, $after - $before), 4);

        if ($delta > 0.00001) {
            $this->writeMovement(
                direction: 'in',
                branchId: (int) $invoice->branch_id,
                warehouseId: (int) $invoice->warehouse_id,
                productId: (int) $item->product_id,
                variantId: $item->product_variant_id ? (int) $item->product_variant_id : null,
                qty: $delta,
                beforeQty: $before,
                afterQty: $after,
                sourceType: 'purchase_invoice',
                sourceId: (int) $invoice->id,
                reference: (string) ($invoice->invoice_number ?? ''),
                createdBy: $createdBy,
                notes: $notes ?? 'Purchase received (cut-length)',
                billingMode: 'length_ft',
                lengthPairs: is_array($item->length_pairs) ? $item->length_pairs : null,
            );
            $this->adjustBranchProductStockQty((int) $invoice->branch_id, (int) $item->product_id, $item->product_variant_id ? (int) $item->product_variant_id : null, $delta);
        }
    }

    /**
     * Apply a completed length_ft sale line: pick smallest rod ≥ requested length, cut, return offcut.
     *
     * @return float Total feet removed from on-hand length pool (for consistency with legacy movement logs).
     */
    public function fulfillSaleLengthLine(
        Sale $sale,
        SaleItem $item,
        ?int $createdBy,
        ?string $notes = null,
    ): float {
        $stock = StockLocator::findLockedOrFail(
            (int) $sale->warehouse_id,
            (int) $item->product_id,
            $item->product_variant_id ? (int) $item->product_variant_id : null,
        );

        $this->ensureLengthItemsFromLegacyStockRow($stock);
        $stock->refresh();

        if (($stock->billing_mode ?? '') !== 'length_ft') {
            throw new RuntimeException('Stock row is not configured for length (length_ft) billing.');
        }

        $beforeQty = (float) $stock->quantity;

        $pairs = LengthBillingPairs::normalizeLengthPairsForStorage(
            is_array($item->length_pairs) ? $item->length_pairs : []
        );

        if ($pairs === []) {
            throw new RuntimeException(
                'Cut-length sale lines must include length × qty pairs so rods can be allocated.'
            );
        }

        foreach ($pairs as $p) {
            $needL = (float) ($p['length'] ?? 0);
            $needQ = (float) ($p['qty'] ?? 0);
            if ($needL <= 0 || $needQ <= 0) {
                continue;
            }

            $iterations = (int) floor($needQ + 0.00001);
            if (abs($needQ - $iterations) > 0.0001) {
                throw new RuntimeException(
                    'Fractional rod counts are not supported for cut-length sales. Use whole numbers for qty.'
                );
            }

            for ($i = 0; $i < $iterations; $i++) {
                $this->consumeOneCut($stock, $needL);
            }
        }

        $this->recomputeStockTotals($stock);
        $afterQty = (float) $stock->fresh()->quantity;
        $ftSold = max(0.0, round($beforeQty - $afterQty, 4));

        $this->writeMovement(
            direction: 'out',
            branchId: (int) $sale->branch_id,
            warehouseId: (int) $sale->warehouse_id,
            productId: (int) $item->product_id,
            variantId: $item->product_variant_id ? (int) $item->product_variant_id : null,
            qty: $ftSold,
            beforeQty: $beforeQty,
            afterQty: $afterQty,
            sourceType: 'sale',
            sourceId: (int) $sale->id,
            reference: (string) ($sale->sale_number ?? ''),
            createdBy: $createdBy,
            notes: $notes ?? 'Sale (cut-length)',
            billingMode: 'length_ft',
            lengthPairs: $pairs,
        );

        $this->adjustBranchProductStockQty((int) $sale->branch_id, (int) $item->product_id, $item->product_variant_id ? (int) $item->product_variant_id : null, -$ftSold);

        return $ftSold;
    }

    /**
     * Restore length pool from a sale line (e.g. sale return). Merges pairs back as available rods/offcuts.
     *
     * @return float Total feet added back
     */
    public function restoreSaleLengthLine(
        Sale $sale,
        SaleItem $item,
        ?int $createdBy,
        ?string $notes = null,
    ): float {
        /** @var Stock|null $stock */
        $stock = Stock::query()
            ->where('warehouse_id', $sale->warehouse_id)
            ->where('product_id', $item->product_id)
            ->where('product_variant_id', $item->product_variant_id)
            ->lockForUpdate()
            ->first();

        if (! $stock) {
            $stock = new Stock([
                'warehouse_id' => $sale->warehouse_id,
                'product_id' => $item->product_id,
                'product_variant_id' => $item->product_variant_id,
                'quantity' => 0,
                'reserved_quantity' => 0,
                'billing_mode' => 'length_ft',
                'length_pairs' => [],
                'status' => 'active',
            ]);
            $stock->save();
        } elseif (($stock->billing_mode ?? '') !== 'length_ft') {
            throw new RuntimeException('Cannot restore length sale line onto a non length_ft stock row.');
        }

        $beforeQty = (float) $stock->quantity;

        $pairs = LengthBillingPairs::normalizeLengthPairsForStorage(
            is_array($item->length_pairs) ? $item->length_pairs : []
        );

        if ($pairs === []) {
            $ft = round((float) $item->quantity, 4);
            if ($ft > 0) {
                $this->mergeAvailableLength($stock, $ft, 1.0);
            }
        } else {
            foreach ($this->mergePairsByLength($pairs) as $row) {
                $this->mergeAvailableLength($stock, $row['length'], $row['qty']);
            }
        }

        $this->recomputeStockTotals($stock);
        $afterQty = (float) $stock->fresh()->quantity;
        $ftAdded = max(0.0, round($afterQty - $beforeQty, 4));

        if ($ftAdded > 0.00001) {
            $this->writeMovement(
                direction: 'in',
                branchId: (int) $sale->branch_id,
                warehouseId: (int) $sale->warehouse_id,
                productId: (int) $item->product_id,
                variantId: $item->product_variant_id ? (int) $item->product_variant_id : null,
                qty: $ftAdded,
                beforeQty: $beforeQty,
                afterQty: $afterQty,
                sourceType: 'sale_return',
                sourceId: (int) $sale->id,
                reference: (string) ($sale->sale_number ?? ''),
                createdBy: $createdBy,
                notes: $notes ?? 'Sale return (cut-length)',
                billingMode: 'length_ft',
                lengthPairs: $pairs !== [] ? $pairs : null,
            );
            $this->adjustBranchProductStockQty((int) $sale->branch_id, (int) $item->product_id, $item->product_variant_id ? (int) $item->product_variant_id : null, $ftAdded);
        }

        return $ftAdded;
    }

    public function recomputeStockTotals(Stock $stock): void
    {
        $stock->refresh();
        $sum = (float) StockLengthItem::query()
            ->where('stock_id', $stock->id)
            ->where('status', 'available')
            ->get()
            ->reduce(static fn (float $carry, StockLengthItem $i): float => $carry + ((float) $i->length * (float) $i->qty), 0.0);

        $sum = round(max(0, $sum), 4);

        $pairs = StockLengthItem::query()
            ->where('stock_id', $stock->id)
            ->where('status', 'available')
            ->orderBy('length')
            ->orderBy('id')
            ->get()
            ->map(static fn (StockLengthItem $i): array => [
                'length' => round((float) $i->length, 6),
                'qty' => round((float) $i->qty, 6),
            ])
            ->values()
            ->all();

        $stock->quantity = $sum;
        $stock->length_pairs = $pairs !== [] ? $pairs : null;
        $stock->save();
    }

    /**
     * @param  array<int, array{length: float, qty: float}>  $pairs
     * @return array<int, array{length: float, qty: float}>
     */
    private function mergePairsByLength(array $pairs): array
    {
        $map = [];
        foreach ($pairs as $row) {
            $l = round((float) ($row['length'] ?? 0), 4);
            $q = round((float) ($row['qty'] ?? 0), 4);
            if ($l <= 0 || $q <= 0) {
                continue;
            }
            $key = sprintf('%.4f', $l);
            if (! isset($map[$key])) {
                $map[$key] = ['length' => $l, 'qty' => 0.0];
            }
            $map[$key]['qty'] = round($map[$key]['qty'] + $q, 4);
        }

        return array_values($map);
    }

    private function mergeAvailableLength(Stock $stock, float $length, float $qtyAdd): void
    {
        if ($qtyAdd <= 0 || $length <= 0) {
            return;
        }

        $len = round($length, 4);
        /** @var StockLengthItem|null $existing */
        $existing = StockLengthItem::query()
            ->where('stock_id', $stock->id)
            ->where('status', 'available')
            ->whereRaw('ABS(length - ?) < 0.0001', [$len])
            ->lockForUpdate()
            ->first();

        if ($existing) {
            $existing->qty = round((float) $existing->qty + $qtyAdd, 4);
            $existing->save();
        } else {
            StockLengthItem::query()->create([
                'stock_id' => $stock->id,
                'length' => $len,
                'qty' => round($qtyAdd, 4),
                'status' => 'available',
            ]);
        }
    }

    private function consumeOneCut(Stock $stock, float $needLength): void
    {
        $need = round($needLength, 4);
        if ($need <= 0) {
            throw new RuntimeException('Invalid cut length.');
        }

        /** @var StockLengthItem|null $rod */
        $rod = StockLengthItem::query()
            ->where('stock_id', $stock->id)
            ->where('status', 'available')
            ->where('qty', '>', 0)
            ->where('length', '>=', $need - 0.0001)
            ->orderBy('length')
            ->orderBy('id')
            ->lockForUpdate()
            ->first();

        if (! $rod) {
            throw new RuntimeException(
                'Insufficient cut-length stock: no rod with length ≥ '.rtrim(rtrim(sprintf('%.4f', $need), '0'), '.').' ft.'
            );
        }

        $rodLen = round((float) $rod->length, 4);
        $rodQty = round((float) $rod->qty, 4);
        if ($rodQty < 1 - 0.0001) {
            throw new RuntimeException('Insufficient rod quantity for stock #'.$stock->id.'.');
        }

        $remainder = round($rodLen - $need, 4);
        $rod->qty = round($rodQty - 1.0, 4);
        if ($rod->qty <= 0.00001) {
            $rod->delete();
        } else {
            $rod->save();
        }

        if ($remainder > 0.0001) {
            $this->mergeAvailableLength($stock, $remainder, 1.0);
        }
    }

    private function writeMovement(
        string $direction,
        int $branchId,
        int $warehouseId,
        int $productId,
        ?int $variantId,
        float $qty,
        float $beforeQty,
        float $afterQty,
        string $sourceType,
        ?int $sourceId,
        ?string $reference,
        ?int $createdBy,
        ?string $notes,
        ?string $billingMode = null,
        ?array $lengthPairs = null,
    ): void {
        InventoryMovement::query()->create([
            'branch_id' => $branchId,
            'warehouse_id' => $warehouseId,
            'product_id' => $productId,
            'product_variant_id' => $variantId,
            'product_batch_id' => null,
            'direction' => $direction,
            'quantity' => $qty,
            'billing_mode' => $billingMode,
            'length_pairs' => $lengthPairs,
            'before_qty' => $beforeQty,
            'after_qty' => $afterQty,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'reference' => $reference,
            'created_by' => $createdBy,
            'notes' => $notes,
        ]);
    }

    private function adjustBranchProductStockQty(int $branchId, int $productId, ?int $variantId, float $delta): void
    {
        if (abs($delta) < 0.0000001) {
            return;
        }

        /** @var BranchProduct|null $bp */
        $bp = BranchProduct::query()
            ->where('branch_id', $branchId)
            ->where('product_id', $productId)
            ->where('product_variant_id', $variantId)
            ->lockForUpdate()
            ->first();

        if (! $bp) {
            if ($delta < 0) {
                return;
            }
            $bp = new BranchProduct([
                'branch_id' => $branchId,
                'product_id' => $productId,
                'product_variant_id' => $variantId,
                'stock_qty' => 0,
                'reserved_qty' => 0,
            ]);
        }

        $bp->stock_qty = round(max(0, (float) $bp->stock_qty + $delta), 4);
        $bp->save();
    }
}
