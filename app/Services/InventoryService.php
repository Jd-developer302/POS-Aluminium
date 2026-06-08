<?php

namespace App\Services;

use App\Models\BranchProduct;
use App\Models\InventoryMovement;
use App\Models\PurchaseInvoice;
use App\Models\Sale;
use App\Models\SaleReturn;
use App\Models\Stock;
use App\Support\StockLocator;
use App\Models\StockAdjustment;
use App\Support\GlassAreaBillingPairs;
use App\Support\LengthBillingPairs;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class InventoryService
{
    /**
     * Context for audit trail.
     *
     * @var array{source_type?:string,source_id?:int,reference?:string,created_by?:int,notes?:string}
     */
    private array $ctx = [];

    public function __construct(
        private readonly LengthCutStockService $lengthCutStockService,
    ) {}

    /**
     * @param  array{source_type?:string,source_id?:int,reference?:string,created_by?:int,notes?:string}  $ctx
     */
    public function withContext(array $ctx): self
    {
        $this->ctx = $ctx;

        return $this;
    }

    public function receivePurchaseInvoice(PurchaseInvoice $invoice): void
    {
        DB::transaction(function () use ($invoice): void {
            $invoice->loadMissing('items');

            foreach ($invoice->items as $item) {
                $pairs = LengthBillingPairs::normalizeLengthPairsForStorage(
                    is_array($item->length_pairs) ? $item->length_pairs : []
                );

                if (($item->billing_mode ?? '') === 'length_ft' && $pairs !== []) {
                    $this->lengthCutStockService->receiveLengthPurchaseLine(
                        $invoice,
                        $item,
                        $this->ctx['created_by'] ?? null,
                        $this->ctx['notes'] ?? null,
                    );
                } else {
                    $this->incrementStock(
                        warehouseId: (int) $invoice->warehouse_id,
                        branchId: (int) $invoice->branch_id,
                        productId: (int) $item->product_id,
                        variantId: $item->product_variant_id ? (int) $item->product_variant_id : null,
                        qty: (float) $item->quantity,
                        sourceType: 'purchase_invoice',
                        sourceId: (int) $invoice->id,
                        reference: (string) ($invoice->invoice_number ?? null),
                        notes: 'Purchase received',
                        billingMode: (string) ($item->billing_mode ?? 'quantity'),
                        lengthPairs: is_array($item->length_pairs) ? $item->length_pairs : null,
                    );
                }
            }
        });
    }

    public function completeSale(Sale $sale): void
    {
        DB::transaction(function () use ($sale): void {
            $sale->loadMissing('items');

            foreach ($sale->items as $item) {
                if (($item->billing_mode ?? '') === 'length_ft') {
                    $this->lengthCutStockService->fulfillSaleLengthLine(
                        $sale,
                        $item,
                        $this->ctx['created_by'] ?? null,
                        $this->ctx['notes'] ?? null,
                    );
                } else {
                    $this->decrementStock(
                        warehouseId: (int) $sale->warehouse_id,
                        branchId: (int) $sale->branch_id,
                        productId: (int) $item->product_id,
                        variantId: $item->product_variant_id ? (int) $item->product_variant_id : null,
                        qty: (float) $item->quantity,
                        sourceType: 'sale',
                        sourceId: (int) $sale->id,
                        reference: (string) ($sale->sale_number ?? null),
                        notes: 'Sale completed',
                        billingMode: (string) ($item->billing_mode ?? 'quantity'),
                        lengthPairs: is_array($item->length_pairs) ? $item->length_pairs : null,
                    );
                }
            }
        });
    }

    public function returnSale(Sale $sale): void
    {
        DB::transaction(function () use ($sale): void {
            $sale->loadMissing('items');

            foreach ($sale->items as $item) {
                if (($item->billing_mode ?? '') === 'length_ft') {
                    $this->lengthCutStockService->restoreSaleLengthLine(
                        $sale,
                        $item,
                        $this->ctx['created_by'] ?? null,
                        $this->ctx['notes'] ?? null,
                    );
                } else {
                    $this->incrementStock(
                        warehouseId: (int) $sale->warehouse_id,
                        branchId: (int) $sale->branch_id,
                        productId: (int) $item->product_id,
                        variantId: $item->product_variant_id ? (int) $item->product_variant_id : null,
                        qty: (float) $item->quantity,
                        sourceType: 'sale_return',
                        sourceId: (int) $sale->id,
                        reference: (string) ($sale->sale_number ?? null),
                        notes: 'Sale returned',
                        billingMode: (string) ($item->billing_mode ?? 'quantity'),
                        lengthPairs: is_array($item->length_pairs) ? $item->length_pairs : null,
                    );
                }
            }
        });
    }

    /**
     * Restock from a {@see SaleReturn} document (line quantities). Call when return status becomes completed.
     */
    public function completeSaleReturn(SaleReturn $saleReturn): void
    {
        DB::transaction(function () use ($saleReturn): void {
            $saleReturn->loadMissing(['items', 'sale']);
            $sale = $saleReturn->sale;
            if (! $sale) {
                throw new RuntimeException('Sale return has no parent sale.');
            }

            $saleReturn->loadMissing('items.saleItem');
            foreach ($saleReturn->items as $row) {
                $saleItem = $row->saleItem;
                $this->incrementStock(
                    warehouseId: (int) $saleReturn->warehouse_id,
                    branchId: (int) $sale->branch_id,
                    productId: (int) $row->product_id,
                    variantId: $row->product_variant_id ? (int) $row->product_variant_id : null,
                    qty: (float) $row->quantity,
                    sourceType: 'sale_return',
                    sourceId: (int) $saleReturn->id,
                    reference: (string) ($saleReturn->return_number ?? null),
                    notes: 'Sale return document',
                    billingMode: (string) ($saleItem?->billing_mode ?? 'quantity'),
                    lengthPairs: is_array($saleItem?->length_pairs) ? $saleItem->length_pairs : null,
                );
            }
        });
    }

    public function completeStockAdjustment(StockAdjustment $adjustment): void
    {
        DB::transaction(function () use ($adjustment): void {
            $adjustment->loadMissing('items');

            foreach ($adjustment->items as $item) {
                $qty = (float) $item->quantity;
                $variantId = $item->product_variant_id ? (int) $item->product_variant_id : null;

                if (in_array($adjustment->type, ['increase'], true)) {
                    $this->incrementStock(
                        warehouseId: (int) $adjustment->warehouse_id,
                        branchId: (int) $adjustment->branch_id,
                        productId: (int) $item->product_id,
                        variantId: $variantId,
                        qty: $qty,
                        sourceType: 'stock_adjustment',
                        sourceId: (int) $adjustment->id,
                        reference: (string) ($adjustment->reference_number ?? null),
                        notes: (string) ($adjustment->type ?? 'adjustment'),
                    );
                } else {
                    $this->decrementStock(
                        warehouseId: (int) $adjustment->warehouse_id,
                        branchId: (int) $adjustment->branch_id,
                        productId: (int) $item->product_id,
                        variantId: $variantId,
                        qty: $qty,
                        sourceType: 'stock_adjustment',
                        sourceId: (int) $adjustment->id,
                        reference: (string) ($adjustment->reference_number ?? null),
                        notes: (string) ($adjustment->type ?? 'adjustment'),
                    );
                }
            }
        });
    }

    public function completeTransfer(int $fromWarehouseId, int $toWarehouseId, int $fromBranchId, int $toBranchId, array $items): void
    {
        DB::transaction(function () use ($fromWarehouseId, $toWarehouseId, $fromBranchId, $toBranchId, $items): void {
            foreach ($items as $it) {
                $productId = (int) $it['product_id'];
                $variantId = isset($it['product_variant_id']) && $it['product_variant_id'] !== null
                    ? (int) $it['product_variant_id']
                    : null;
                $qty = (float) $it['quantity'];
                $received = isset($it['received_quantity']) ? (float) $it['received_quantity'] : $qty;
                $billingMode = (string) ($it['billing_mode'] ?? 'quantity');
                $pairs = is_array($it['length_pairs'] ?? null) ? $it['length_pairs'] : [];

                $this->decrementStock(
                    warehouseId: $fromWarehouseId,
                    branchId: $fromBranchId,
                    productId: $productId,
                    variantId: $variantId,
                    qty: $qty,
                    sourceType: $this->ctx['source_type'] ?? 'stock_transfer',
                    sourceId: $this->ctx['source_id'] ?? null,
                    reference: $this->ctx['reference'] ?? null,
                    notes: $this->ctx['notes'] ?? 'Transfer out',
                    billingMode: $billingMode,
                    lengthPairs: $pairs !== [] ? $pairs : null,
                );

                $this->incrementStock(
                    warehouseId: $toWarehouseId,
                    branchId: $toBranchId,
                    productId: $productId,
                    variantId: $variantId,
                    qty: $received,
                    sourceType: $this->ctx['source_type'] ?? 'stock_transfer',
                    sourceId: $this->ctx['source_id'] ?? null,
                    reference: $this->ctx['reference'] ?? null,
                    notes: $this->ctx['notes'] ?? 'Transfer in',
                    billingMode: $billingMode,
                    lengthPairs: $pairs !== [] ? $pairs : null,
                );

                if (in_array($billingMode, ['length_ft', 'area_sqft'], true) && $pairs !== []) {
                    $this->applyTransferPairsOnStockRows(
                        fromWarehouseId: $fromWarehouseId,
                        toWarehouseId: $toWarehouseId,
                        productId: $productId,
                        variantId: $variantId,
                        billingMode: $billingMode,
                        pairs: $pairs,
                    );
                }
            }
        });
    }

    /**
     * @param  array<int, array<string, float>>  $pairs
     */
    private function applyTransferPairsOnStockRows(
        int $fromWarehouseId,
        int $toWarehouseId,
        int $productId,
        ?int $variantId,
        string $billingMode,
        array $pairs,
    ): void {
        $fromStock = StockLocator::findLocked($fromWarehouseId, $productId, $variantId);
        if ($fromStock !== null) {
            $remaining = $this->subtractPairsFromStock($fromStock, $billingMode, $pairs);
            $fromStock->length_pairs = $remaining;
            $fromStock->save();
            if ($billingMode === 'length_ft') {
                $this->lengthCutStockService->syncLengthItemsFromStockLengthPairs($fromStock);
            }
        }

        $toStock = StockLocator::findLocked($toWarehouseId, $productId, $variantId);

        if ($toStock !== null) {
            $merged = $this->mergePairsIntoStock($toStock, $billingMode, $pairs);
            $toStock->billing_mode = $billingMode;
            $toStock->length_pairs = $merged;
            $toStock->save();
            if ($billingMode === 'length_ft') {
                $this->lengthCutStockService->syncLengthItemsFromStockLengthPairs($toStock);
            }
        }
    }

    /**
     * @param  array<int, array<string, float>>  $pairs
     * @return array<int, array<string, float>>
     */
    private function mergePairsIntoStock(Stock $stock, string $billingMode, array $pairs): array
    {
        if ($billingMode === 'area_sqft') {
            $existing = GlassAreaBillingPairs::normalizeAreaPairsForStorage(
                is_array($stock->length_pairs) ? $stock->length_pairs : []
            );
            $incoming = GlassAreaBillingPairs::normalizeAreaPairsForStorage($pairs);
            $map = [];
            foreach ($existing as $row) {
                $key = $row['width'].'|'.$row['height'];
                $map[$key] = $row;
            }
            foreach ($incoming as $row) {
                $key = $row['width'].'|'.$row['height'];
                if (! isset($map[$key])) {
                    $map[$key] = $row;
                } else {
                    $map[$key]['qty'] = round($map[$key]['qty'] + $row['qty'], 6);
                }
            }

            return array_values(array_filter($map, static fn (array $r): bool => $r['qty'] > 0));
        }

        $existing = LengthBillingPairs::normalizeLengthPairsForStorage(
            is_array($stock->length_pairs) ? $stock->length_pairs : []
        );
        $incoming = LengthBillingPairs::normalizeLengthPairsForStorage($pairs);
        $map = [];
        foreach ($existing as $row) {
            $key = (string) $row['length'];
            $map[$key] = $row;
        }
        foreach ($incoming as $row) {
            $key = (string) $row['length'];
            if (! isset($map[$key])) {
                $map[$key] = $row;
            } else {
                $map[$key]['qty'] = round($map[$key]['qty'] + $row['qty'], 6);
            }
        }

        return array_values(array_filter($map, static fn (array $r): bool => $r['qty'] > 0));
    }

    /**
     * @param  array<int, array<string, float>>  $pairs
     * @return array<int, array<string, float>>
     */
    private function subtractPairsFromStock(Stock $stock, string $billingMode, array $pairs): array
    {
        if ($billingMode === 'area_sqft') {
            $existing = GlassAreaBillingPairs::normalizeAreaPairsForStorage(
                is_array($stock->length_pairs) ? $stock->length_pairs : []
            );
            $remove = GlassAreaBillingPairs::normalizeAreaPairsForStorage($pairs);
            $map = [];
            foreach ($existing as $row) {
                $key = $row['width'].'|'.$row['height'];
                $map[$key] = $row;
            }
            foreach ($remove as $row) {
                $key = $row['width'].'|'.$row['height'];
                if (! isset($map[$key])) {
                    continue;
                }
                $map[$key]['qty'] = round(max(0, $map[$key]['qty'] - $row['qty']), 6);
                if ($map[$key]['qty'] <= 0) {
                    unset($map[$key]);
                }
            }

            return array_values($map);
        }

        $existing = LengthBillingPairs::normalizeLengthPairsForStorage(
            is_array($stock->length_pairs) ? $stock->length_pairs : []
        );
        $remove = LengthBillingPairs::normalizeLengthPairsForStorage($pairs);
        $map = [];
        foreach ($existing as $row) {
            $key = (string) $row['length'];
            $map[$key] = $row;
        }
        foreach ($remove as $row) {
            $key = (string) $row['length'];
            if (! isset($map[$key])) {
                continue;
            }
            $map[$key]['qty'] = round(max(0, $map[$key]['qty'] - $row['qty']), 6);
            if ($map[$key]['qty'] <= 0) {
                unset($map[$key]);
            }
        }

        return array_values($map);
    }

    private function incrementStock(
        int $warehouseId,
        int $branchId,
        int $productId,
        ?int $variantId,
        float $qty,
        ?string $sourceType = null,
        ?int $sourceId = null,
        ?string $reference = null,
        ?string $notes = null,
        ?string $billingMode = null,
        ?array $lengthPairs = null,
    ): void {
        if ($qty <= 0) {
            return;
        }

        /** @var Stock $stock */
        $stock = Stock::query()
            ->where('warehouse_id', $warehouseId)
            ->where('product_id', $productId)
            ->where('product_variant_id', $variantId)
            ->lockForUpdate()
            ->first();

        if (! $stock) {
            $stock = new Stock([
                'warehouse_id' => $warehouseId,
                'product_id' => $productId,
                'product_variant_id' => $variantId,
                'quantity' => 0,
                'reserved_quantity' => 0,
                'status' => 'active',
            ]);
        }

        $before = (float) $stock->quantity;
        $stock->quantity = $before + $qty;
        $stock->save();
        $after = (float) $stock->quantity;

        $this->logMovement(
            direction: 'in',
            warehouseId: $warehouseId,
            branchId: $branchId,
            productId: $productId,
            variantId: $variantId,
            qty: $qty,
            beforeQty: $before,
            afterQty: $after,
            sourceType: $sourceType ?? ($this->ctx['source_type'] ?? 'system'),
            sourceId: $sourceId ?? ($this->ctx['source_id'] ?? null),
            reference: $reference ?? ($this->ctx['reference'] ?? null),
            notes: $notes ?? ($this->ctx['notes'] ?? null),
            billingMode: $billingMode ?? (string) ($stock->billing_mode ?? 'quantity'),
            lengthPairs: $lengthPairs,
        );

        /** @var BranchProduct|null $bp */
        $bp = BranchProduct::query()
            ->where('branch_id', $branchId)
            ->where('product_id', $productId)
            ->where('product_variant_id', $variantId)
            ->lockForUpdate()
            ->first();

        if (! $bp) {
            $bp = new BranchProduct([
                'branch_id' => $branchId,
                'product_id' => $productId,
                'product_variant_id' => $variantId,
                'stock_qty' => 0,
                'reserved_qty' => 0,
            ]);
        }

        $bp->stock_qty = (float) $bp->stock_qty + $qty;
        $bp->save();
    }

    private function decrementStock(
        int $warehouseId,
        int $branchId,
        int $productId,
        ?int $variantId,
        float $qty,
        ?string $sourceType = null,
        ?int $sourceId = null,
        ?string $reference = null,
        ?string $notes = null,
        ?string $billingMode = null,
        ?array $lengthPairs = null,
    ): void {
        if ($qty <= 0) {
            return;
        }

        $stock = StockLocator::findLockedOrFail($warehouseId, $productId, $variantId);

        $available = (float) $stock->quantity - (float) $stock->reserved_quantity;
        if ($available < $qty) {
            throw new RuntimeException(
                'Insufficient stock for product '.$productId.' (on hand: '.(string) $available.'; needed: '.(string) $qty.').'
            );
        }

        $before = (float) $stock->quantity;
        $stock->quantity = $before - $qty;
        $stock->save();
        $after = (float) $stock->quantity;

        $this->logMovement(
            direction: 'out',
            warehouseId: $warehouseId,
            branchId: $branchId,
            productId: $productId,
            variantId: $variantId,
            qty: $qty,
            beforeQty: $before,
            afterQty: $after,
            sourceType: $sourceType ?? ($this->ctx['source_type'] ?? 'system'),
            sourceId: $sourceId ?? ($this->ctx['source_id'] ?? null),
            reference: $reference ?? ($this->ctx['reference'] ?? null),
            notes: $notes ?? ($this->ctx['notes'] ?? null),
            billingMode: $billingMode ?? (string) ($stock->billing_mode ?? 'quantity'),
            lengthPairs: $lengthPairs,
        );

        /** @var BranchProduct|null $bp */
        $bp = BranchProduct::query()
            ->where('branch_id', $branchId)
            ->where('product_id', $productId)
            ->where('product_variant_id', $variantId)
            ->lockForUpdate()
            ->first();

        if ($bp) {
            $bp->stock_qty = max(0, (float) $bp->stock_qty - $qty);
            $bp->save();
        }
    }

    private function logMovement(
        string $direction,
        int $warehouseId,
        int $branchId,
        int $productId,
        ?int $variantId,
        float $qty,
        float $beforeQty,
        float $afterQty,
        string $sourceType,
        ?int $sourceId,
        ?string $reference,
        ?string $notes,
        ?string $billingMode = null,
        ?array $lengthPairs = null,
    ): void {
        InventoryMovement::create([
            'branch_id' => $branchId,
            'warehouse_id' => $warehouseId,
            'product_id' => $productId,
            'product_variant_id' => $variantId,
            'direction' => $direction,
            'quantity' => $qty,
            'billing_mode' => $billingMode,
            'length_pairs' => $lengthPairs,
            'before_qty' => $beforeQty,
            'after_qty' => $afterQty,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'reference' => $reference,
            'created_by' => $this->ctx['created_by'] ?? null,
            'notes' => $notes,
        ]);
    }
}
