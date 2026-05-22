<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Company\Branch;
use App\Models\Company\Warehouse;
use App\Models\InventoryMovement;
use App\Models\Product\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryMovementController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->only([
            'q',
            'direction',
            'source_type',
            'branch_id',
            'warehouse_id',
            'product_id',
            'from',
            'to',
        ]);

        $movements = InventoryMovement::query()
            ->with([
                'product:id,name',
                'branch:id,name',
                'warehouse:id,name,branch_id',
                'createdBy:id,name',
                'createdBy.employee:id,user_id,name',
            ])
            ->when($filters['q'] ?? null, function ($q, $v) {
                $q->where(function ($qq) use ($v) {
                    $qq->where('reference', 'like', '%'.$v.'%')
                        ->orWhere('source_type', 'like', '%'.$v.'%');
                });
            })
            ->when($filters['direction'] ?? null, fn ($q, $v) => $q->where('direction', $v))
            ->when($filters['source_type'] ?? null, fn ($q, $v) => $q->where('source_type', $v))
            ->when($filters['branch_id'] ?? null, fn ($q, $v) => $q->where('branch_id', $v))
            ->when($filters['warehouse_id'] ?? null, fn ($q, $v) => $q->where('warehouse_id', $v))
            ->when($filters['product_id'] ?? null, fn ($q, $v) => $q->where('product_id', $v))
            ->when($filters['from'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($filters['to'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        $branches = Branch::query()->where('status', 'active')->get(['id', 'name']);
        $warehouses = Warehouse::query()->where('status', 'active')->get(['id', 'name', 'branch_id']);
        $products = Product::query()->where('status', 'active')->orderBy('name')->limit(300)->get(['id', 'name']);

        return Inertia::render('InventoryMovement/Index', [
            'movements' => $movements,
            'filters' => $filters,
            'branches' => $branches,
            'warehouses' => $warehouses,
            'products' => $products,
        ]);
    }

    public function destroy(InventoryMovement $inventoryMovement): RedirectResponse
    {
        $inventoryMovement->delete();

        return redirect()->back()->with('success', 'Inventory movement deleted.');
    }
}
