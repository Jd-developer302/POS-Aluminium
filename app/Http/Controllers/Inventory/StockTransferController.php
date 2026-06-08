<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Company\Branch;
use App\Models\Company\Warehouse;
use App\Models\Product\Product;
use App\Models\Product\ProductVarient;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Services\InventoryService;
use App\Support\BillingLineResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class StockTransferController extends Controller
{
    public function index()
    {
        $transfers = StockTransfer::query()
            ->latest('transfer_date')
            ->paginate(15);

        return Inertia::render('StockTransfer/Index', [
            'transfers' => $transfers,
        ]);
    }

    public function create()
    {
        return Inertia::render('StockTransfer/Create', [
            'branches' => Branch::query()->where('status', 'active')->get(['id', 'name']),
            'warehouses' => Warehouse::query()->where('status', 'active')->get(['id', 'name', 'branch_id']),
            'products' => $this->transferFormProducts(),
        ]);
    }

    public function store(Request $request, InventoryService $inventory)
    {
        $validated = $request->validate([
            'from_branch_id' => ['required', 'exists:branches,id', 'different:to_branch_id'],
            'to_branch_id' => ['required', 'exists:branches,id'],
            'from_warehouse_id' => ['required', 'exists:warehouses,id'],
            'to_warehouse_id' => ['required', 'exists:warehouses,id'],
            'transfer_date' => ['required', 'date'],
            'reference_number' => ['required', 'string', 'max:100'],
            'status' => ['required', 'in:draft,completed'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.product_variant_id' => ['nullable', 'exists:product_varients,id'],
            'items.*.billing_mode' => ['nullable', Rule::in(BillingLineResolver::allowedModes())],
            'items.*.length_pairs' => ['nullable', 'array'],
            'items.*.length_pairs.*.length' => ['nullable', 'numeric', 'min:0'],
            'items.*.length_pairs.*.width' => ['nullable', 'numeric', 'min:0'],
            'items.*.length_pairs.*.height' => ['nullable', 'numeric', 'min:0'],
            'items.*.length_pairs.*.qty' => ['nullable', 'numeric', 'min:0'],
            'items.*.quantity' => ['required', 'numeric', 'min:0'],
        ]);

        foreach ($validated['items'] as $it) {
            $mode = BillingLineResolver::normalizeMode($it['billing_mode'] ?? null);
            if ($mode === 'length_ft' || $mode === 'area_sqft') {
                $resolved = BillingLineResolver::resolveStockRow([
                    'billing_mode' => $mode,
                    'length_pairs' => $it['length_pairs'] ?? [],
                    'quantity' => 0,
                ]);
                if ($resolved['quantity'] <= 0) {
                    return redirect()
                        ->back()
                        ->withInput()
                        ->with('error', $mode === 'area_sqft'
                            ? 'Glass transfer: total sq ft must be greater than zero.'
                            : 'Length transfer: total feet must be greater than zero.');
                }
            } elseif ((float) ($it['quantity'] ?? 0) < 0.0001) {
                return redirect()
                    ->back()
                    ->withInput()
                    ->with('error', 'Each line must have a quantity greater than zero.');
            }
        }

        $transfer = DB::transaction(function () use ($validated, $inventory): StockTransfer {
            $linePayloads = [];
            $totalQty = 0.0;

            foreach ($validated['items'] as $it) {
                $resolved = BillingLineResolver::resolveStockRow([
                    'billing_mode' => $it['billing_mode'] ?? 'quantity',
                    'length_pairs' => $it['length_pairs'] ?? [],
                    'quantity' => $it['quantity'] ?? 0,
                ]);
                $qty = (float) $resolved['quantity'];
                $totalQty += $qty;
                $linePayloads[] = [
                    'product_id' => (int) $it['product_id'],
                    'product_variant_id' => ! empty($it['product_variant_id'])
                        ? (int) $it['product_variant_id']
                        : null,
                    'billing_mode' => $resolved['billing_mode'],
                    'length_pairs' => $resolved['length_pairs'],
                    'quantity' => $qty,
                    'received_quantity' => $qty,
                ];
            }

            $transfer = StockTransfer::create([
                'from_branch_id' => $validated['from_branch_id'],
                'to_branch_id' => $validated['to_branch_id'],
                'from_warehouse_id' => $validated['from_warehouse_id'],
                'to_warehouse_id' => $validated['to_warehouse_id'],
                'created_by' => Auth::id(),
                'transfer_date' => $validated['transfer_date'],
                'reference_number' => $validated['reference_number'],
                'notes' => $validated['notes'] ?? null,
                'status' => $validated['status'],
                'total_quantity' => $totalQty,
            ]);

            foreach ($linePayloads as $row) {
                StockTransferItem::create([
                    'stock_transfer_id' => $transfer->id,
                    ...$row,
                ]);
            }

            if ($transfer->status === 'completed') {
                $inventory->withContext([
                    'source_type' => 'stock_transfer',
                    'source_id' => (int) $transfer->id,
                    'reference' => (string) $transfer->reference_number,
                    'created_by' => Auth::id(),
                    'notes' => 'Branch transfer completed',
                ])->completeTransfer(
                    fromWarehouseId: (int) $transfer->from_warehouse_id,
                    toWarehouseId: (int) $transfer->to_warehouse_id,
                    fromBranchId: (int) $transfer->from_branch_id,
                    toBranchId: (int) $transfer->to_branch_id,
                    items: $transfer->items()
                        ->get(['product_id', 'product_variant_id', 'quantity', 'received_quantity', 'billing_mode', 'length_pairs'])
                        ->toArray(),
                );
            }

            return $transfer;
        });

        return redirect()
            ->route('stock-transfers.show', $transfer->id)
            ->with('success', 'Transfer created successfully.');
    }

    public function show(StockTransfer $stock_transfer)
    {
        $stock_transfer->load([
            'items',
            'items.product:id,name',
            'items.productVarient:id,product_id,name,sku',
        ]);

        return Inertia::render('StockTransfer/Show', [
            'transfer' => $stock_transfer,
        ]);
    }

    /**
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    private function transferFormProducts()
    {
        return Product::query()
            ->where('status', 'active')
            ->with([
                'varients' => fn ($q) => $q
                    ->where('status', 'active')
                    ->orderBy('sku')
                    ->with([
                        'varientAttributes.attribute:id,name',
                        'varientAttributes.attributeValue:id,value',
                    ]),
            ])
            ->orderBy('name')
            ->limit(300)
            ->get(['id', 'name', 'type'])
            ->map(static function (Product $p): array {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'type' => $p->type,
                    'variants' => $p->varients
                        ->map(static function (ProductVarient $v): array {
                            return [
                                'id' => $v->id,
                                'sku' => $v->sku,
                                'name' => $v->name,
                                'attribute_labels' => $v->varientAttributes
                                    ->map(static fn ($pva): array => [
                                        'attribute' => $pva->attribute?->name ?? '',
                                        'value' => $pva->attributeValue?->value ?? '',
                                    ])
                                    ->filter(static fn (array $row): bool => $row['attribute'] !== '' || $row['value'] !== '')
                                    ->values()
                                    ->all(),
                            ];
                        })
                        ->values()
                        ->all(),
                ];
            });
    }
}
