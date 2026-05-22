<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Models\Company\Branch;
use App\Models\Company\Warehouse;
use App\Models\Product\Product;
use App\Models\Product\ProductVarient;
use App\Models\ProductBatch;
use App\Models\StockAdjustment;
use App\Models\StockAdjustmentItem;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use RuntimeException;

class StockAdjustmentController extends Controller
{
    public function index()
    {
        $adjustments = StockAdjustment::query()
            ->with([
                'items',
            ])
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('StockAdjustment/Index', [
            'adjustments' => $adjustments,
        ]);
    }

    public function create(Request $request)
    {
        $products = Product::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->limit(300)
            ->get(['id', 'name']);

        $variants = ProductVarient::query()
            ->orderBy('name')
            ->limit(1200)
            ->get(['id', 'product_id', 'name', 'sku']);

        $batches = ProductBatch::query()
            ->orderByDesc('id')
            ->limit(1200)
            ->get(['id', 'product_id', 'product_variant_id', 'batch_number', 'expiry_date']);

        $branches = Branch::query()->where('status', 'active')->get(['id', 'name']);
        $warehouses = Warehouse::query()->where('status', 'active')->get(['id', 'name', 'branch_id']);

        return Inertia::render('StockAdjustment/Create', [
            'branches' => $branches,
            'warehouses' => $warehouses,
            'products' => $products,
            'variants' => $variants,
            'batches' => $batches,
            'prefillProductId' => $request->query('product_id'),
        ]);
    }

    public function store(Request $request, InventoryService $inventory)
    {
        $data = $request->validate([
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'adjustment_date' => ['required', 'date'],
            'reference_number' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:increase,decrease,damage,wastage,manual'],
            'reason' => ['nullable', 'string'],
            'status' => ['required', 'in:draft,completed,cancelled'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.product_variant_id' => ['nullable', 'integer', 'exists:product_varients,id'],
            'items.*.product_batch_id' => ['nullable', 'integer', 'exists:product_batches,id'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.notes' => ['nullable', 'string'],
        ]);

        return DB::transaction(function () use ($data, $inventory) {
            $totalQty = collect($data['items'])->sum(fn ($it) => (float) $it['quantity']);

            $adj = StockAdjustment::query()->create([
                'warehouse_id' => $data['warehouse_id'],
                'branch_id' => $data['branch_id'],
                'created_by' => Auth::id(),
                'adjustment_date' => $data['adjustment_date'],
                'reference_number' => $data['reference_number'],
                'type' => $data['type'],
                'reason' => $data['reason'] ?? null,
                'status' => $data['status'],
                'total_quantity' => $totalQty,
            ]);

            foreach ($data['items'] as $it) {
                StockAdjustmentItem::query()->create([
                    'stock_adjustment_id' => $adj->id,
                    'product_id' => $it['product_id'],
                    'product_variant_id' => $it['product_variant_id'] ?? null,
                    'product_batch_id' => $it['product_batch_id'] ?? null,
                    'quantity' => $it['quantity'],
                    'notes' => $it['notes'] ?? null,
                ]);
            }

            if ($adj->status === 'completed') {
                try {
                    $inventory->withContext([
                        'source_type' => 'stock_adjustment',
                        'source_id' => (int) $adj->id,
                        'reference' => (string) ($adj->reference_number ?? null),
                        'created_by' => Auth::id(),
                        'notes' => (string) ($adj->reason ?? null),
                    ])->completeStockAdjustment($adj);
                } catch (RuntimeException $e) {
                    throw $e;
                }
            }

            return redirect()
                ->route('stock-adjustments.show', $adj)
                ->with('success', 'Stock adjustment created.');
        });
    }

    public function show(StockAdjustment $stock_adjustment)
    {
        $stock_adjustment->load([
            'items',
        ]);

        return Inertia::render('StockAdjustment/Show', [
            'adjustment' => $stock_adjustment,
        ]);
    }

    public function edit(StockAdjustment $stock_adjustment)
    {
        $stock_adjustment->load(['items']);

        $products = Product::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->limit(300)
            ->get(['id', 'name']);

        $variants = ProductVarient::query()
            ->orderBy('name')
            ->limit(1200)
            ->get(['id', 'product_id', 'name', 'sku']);

        $batches = ProductBatch::query()
            ->orderByDesc('id')
            ->limit(1200)
            ->get(['id', 'product_id', 'product_variant_id', 'batch_number', 'expiry_date']);

        $branches = Branch::query()->where('status', 'active')->get(['id', 'name']);
        $warehouses = Warehouse::query()->where('status', 'active')->get(['id', 'name', 'branch_id']);

        return Inertia::render('StockAdjustment/Edit', [
            'adjustment' => $stock_adjustment,
            'branches' => $branches,
            'warehouses' => $warehouses,
            'products' => $products,
            'variants' => $variants,
            'batches' => $batches,
        ]);
    }

    public function update(Request $request, StockAdjustment $stock_adjustment, InventoryService $inventory)
    {
        $data = $request->validate([
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'adjustment_date' => ['required', 'date'],
            'reference_number' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:increase,decrease,damage,wastage,manual'],
            'reason' => ['nullable', 'string'],
            'status' => ['required', 'in:draft,completed,cancelled'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['nullable', 'integer'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.product_variant_id' => ['nullable', 'integer', 'exists:product_varients,id'],
            'items.*.product_batch_id' => ['nullable', 'integer', 'exists:product_batches,id'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.notes' => ['nullable', 'string'],
        ]);

        return DB::transaction(function () use ($data, $stock_adjustment, $inventory) {
            $wasCompleted = $stock_adjustment->status === 'completed';

            $totalQty = collect($data['items'])->sum(fn ($it) => (float) $it['quantity']);

            $stock_adjustment->update([
                'warehouse_id' => $data['warehouse_id'],
                'branch_id' => $data['branch_id'],
                'adjustment_date' => $data['adjustment_date'],
                'reference_number' => $data['reference_number'],
                'type' => $data['type'],
                'reason' => $data['reason'] ?? null,
                'status' => $data['status'],
                'total_quantity' => $totalQty,
            ]);

            $keepIds = [];
            foreach ($data['items'] as $it) {
                $item = null;
                if (! empty($it['id'])) {
                    $item = StockAdjustmentItem::query()
                        ->where('stock_adjustment_id', $stock_adjustment->id)
                        ->where('id', $it['id'])
                        ->first();
                }
                if (! $item) {
                    $item = new StockAdjustmentItem(['stock_adjustment_id' => $stock_adjustment->id]);
                }
                $item->fill([
                    'product_id' => $it['product_id'],
                    'product_variant_id' => $it['product_variant_id'] ?? null,
                    'product_batch_id' => $it['product_batch_id'] ?? null,
                    'quantity' => $it['quantity'],
                    'notes' => $it['notes'] ?? null,
                ]);
                $item->save();
                $keepIds[] = $item->id;
            }

            StockAdjustmentItem::query()
                ->where('stock_adjustment_id', $stock_adjustment->id)
                ->whereNotIn('id', $keepIds)
                ->delete();

            if (! $wasCompleted && $stock_adjustment->status === 'completed') {
                $inventory->withContext([
                    'source_type' => 'stock_adjustment',
                    'source_id' => (int) $stock_adjustment->id,
                    'reference' => (string) ($stock_adjustment->reference_number ?? null),
                    'created_by' => Auth::id(),
                    'notes' => (string) ($stock_adjustment->reason ?? null),
                ])->completeStockAdjustment($stock_adjustment);
            }

            return redirect()
                ->route('stock-adjustments.show', $stock_adjustment)
                ->with('success', 'Stock adjustment updated.');
        });
    }

    public function destroy(StockAdjustment $stock_adjustment)
    {
        $stock_adjustment->delete();

        return redirect()->route('stock-adjustments.index')->with('success', 'Stock adjustment deleted.');
    }
}
