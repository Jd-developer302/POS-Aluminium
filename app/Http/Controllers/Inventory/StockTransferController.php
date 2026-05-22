<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Company\Branch;
use App\Models\Company\Warehouse;
use App\Models\Product\Product;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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
            'products' => Product::query()->where('status', 'active')->orderBy('name')->limit(300)->get(['id', 'name']),
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
            'items.*.quantity' => ['required', 'numeric', 'min:0.0001'],
        ]);

        $transfer = DB::transaction(function () use ($validated, $inventory): StockTransfer {
            $totalQty = 0;
            foreach ($validated['items'] as $it) {
                $totalQty += (float) $it['quantity'];
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

            foreach ($validated['items'] as $it) {
                StockTransferItem::create([
                    'stock_transfer_id' => $transfer->id,
                    'product_id' => $it['product_id'],
                    'product_variant_id' => $it['product_variant_id'] ?? null,
                    'quantity' => $it['quantity'],
                    'received_quantity' => $it['quantity'],
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
                    items: $transfer->items()->get(['product_id', 'product_variant_id', 'quantity', 'received_quantity'])->toArray(),
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
        $stock_transfer->load('items');

        return Inertia::render('StockTransfer/Show', [
            'transfer' => $stock_transfer,
        ]);
    }
}
