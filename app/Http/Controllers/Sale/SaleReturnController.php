<?php

namespace App\Http\Controllers\Sale;

use App\Http\Controllers\Controller;
use App\Models\Company\Warehouse;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use App\Models\SaleReturnItem;
use App\Services\InventoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class SaleReturnController extends Controller
{
    public function index(): Response
    {
        $returns = SaleReturn::query()
            ->with([
                'sale:id,sale_number,sale_date,status,branch_id',
                'warehouse:id,name',
            ])
            ->latest('return_date')
            ->latest('id')
            ->paginate(15);

        return Inertia::render('Sale/Return/Index', [
            'returnPages' => $returns,
        ]);
    }

    public function create(Request $request): Response
    {
        $sales = Sale::query()
            ->where('status', 'completed')
            ->orderByDesc('sale_date')
            ->limit(200)
            ->get(['id', 'sale_number', 'sale_date', 'total', 'status']);

        $selectedSale = null;
        if ($request->filled('sale_id')) {
            $sale = Sale::query()
                ->where('status', 'completed')
                ->with(['items.product:id,name,slug', 'branch:id,name', 'warehouse:id,name'])
                ->find($request->integer('sale_id'));
            if ($sale) {
                $selectedSale = [
                    'id' => $sale->id,
                    'sale_number' => $sale->sale_number,
                    'sale_date' => $sale->sale_date,
                    'total' => $sale->total,
                    'branch_id' => $sale->branch_id,
                    'warehouse_id' => $sale->warehouse_id,
                    'customer_id' => $sale->customer_id,
                    'items' => $sale->items->map(function (SaleItem $it) {
                        return [
                            'id' => $it->id,
                            'product_id' => $it->product_id,
                            'product_name' => $it->product?->name,
                            'product_variant_id' => $it->product_variant_id,
                            'quantity_sold' => (float) $it->quantity,
                            'unit_price' => (float) $it->unit_price,
                            'remaining' => $this->remainingForSaleItem($it),
                        ];
                    })->values()->all(),
                ];
            }
        }

        $warehouses = Warehouse::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'branch_id']);

        return Inertia::render('Sale/Return/Create', [
            'sales' => $sales,
            'selectedSale' => $selectedSale,
            'warehouses' => $warehouses,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'sale_id' => ['required', 'exists:sales,id'],
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'return_date' => ['required', 'date'],
            'refund_amount' => ['nullable', 'numeric', 'min:0'],
            'refund_method' => ['nullable', 'in:cash,bank_transfer,credit_note'],
            'reason' => ['nullable', 'string', 'max:5000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.sale_item_id' => ['required', 'exists:sale_items,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0'],
        ]);

        /** @var Sale $sale */
        $sale = Sale::query()
            ->with('items')
            ->findOrFail($validated['sale_id']);

        if ($sale->status !== 'completed') {
            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Only completed sales can have a return document.');
        }

        $warehouse = Warehouse::query()->findOrFail($validated['warehouse_id']);
        if ((int) $warehouse->branch_id !== (int) $sale->branch_id) {
            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Warehouse must belong to the same branch as the sale.');
        }

        $refund = (float) ($validated['refund_amount'] ?? 0);
        $refundMethod = $validated['refund_method'] ?? null;
        if ($refund > 0 && ($refundMethod === null || $refundMethod === '')) {
            $request->validate(['refund_method' => ['required', 'in:cash,bank_transfer,credit_note']]);
        }

        $qtyBySaleItem = [];
        foreach ($validated['items'] as $row) {
            $sid = (int) $row['sale_item_id'];
            $qtyBySaleItem[$sid] = ($qtyBySaleItem[$sid] ?? 0) + (float) $row['quantity'];
        }
        foreach ($qtyBySaleItem as $saleItemId => $sumQty) {
            $item = $sale->items->firstWhere('id', $saleItemId);
            if (! $item) {
                return redirect()
                    ->back()
                    ->withInput()
                    ->with('error', 'Invalid line for this sale.');
            }
            if ((int) $item->sale_id !== (int) $sale->id) {
                return redirect()
                    ->back()
                    ->withInput()
                    ->with('error', 'A line does not belong to the selected sale.');
            }
            $rem = $this->remainingForSaleItem($item);
            if ($sumQty > $rem + 1e-6) {
                return redirect()
                    ->back()
                    ->withInput()
                    ->with('error', "Return quantity too high for line #{$item->id} (max {$rem}).");
            }
        }

        $lines = [];
        $subtotal = 0.0;
        $tax = 0.0;

        foreach ($validated['items'] as $row) {
            $item = $sale->items->firstWhere('id', (int) $row['sale_item_id']);
            if (! $item) {
                return redirect()
                    ->back()
                    ->withInput()
                    ->with('error', 'Invalid line for this sale.');
            }
            $qty = (float) $row['quantity'];
            if ($qty <= 0) {
                continue;
            }

            $lineSub = round($qty * (float) $item->unit_price, 2);
            $subtotal += $lineSub;
            $lines[] = [
                'sale_item_id' => $item->id,
                'product_id' => (int) $item->product_id,
                'product_variant_id' => $item->product_variant_id,
                'quantity' => $qty,
                'unit_price' => (float) $item->unit_price,
                'subtotal' => $lineSub,
            ];
        }
        if (count($lines) < 1) {
            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Add at least one line with quantity greater than zero.');
        }

        $total = $subtotal + $tax;
        if ($refund > $total + 0.0001) {
            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Refund amount cannot be greater than return total.');
        }

        try {
            $returnId = DB::transaction(function () use (
                $sale,
                $validated,
                $subtotal,
                $tax,
                $total,
                $refund,
                $refundMethod,
                $lines,
            ): int {
                $returnNumber = $this->nextReturnNumber();

                $ret = SaleReturn::query()->create([
                    'sale_id' => $sale->id,
                    'customer_id' => $sale->customer_id,
                    'warehouse_id' => (int) $validated['warehouse_id'],
                    'created_by' => Auth::id(),
                    'return_number' => $returnNumber,
                    'return_date' => $validated['return_date'],
                    'subtotal' => number_format($subtotal, 2, '.', ''),
                    'tax_amount' => number_format($tax, 2, '.', ''),
                    'total' => number_format($total, 2, '.', ''),
                    'refund_amount' => $refund > 0 ? number_format($refund, 2, '.', '') : '0.00',
                    'refund_method' => $refund > 0 ? $refundMethod : null,
                    'status' => 'pending',
                    'reason' => $validated['reason'] ?? null,
                ]);

                foreach ($lines as $line) {
                    SaleReturnItem::query()->create([
                        'sale_return_id' => $ret->id,
                        'sale_item_id' => $line['sale_item_id'],
                        'product_id' => $line['product_id'],
                        'product_variant_id' => $line['product_variant_id'],
                        'quantity' => (string) $line['quantity'],
                        'unit_price' => number_format($line['unit_price'], 2, '.', ''),
                        'subtotal' => number_format($line['subtotal'], 2, '.', ''),
                    ]);
                }

                return (int) $ret->id;
            });
        } catch (RuntimeException $e) {
            return redirect()
                ->back()
                ->withInput()
                ->with('error', $e->getMessage());
        }

        return redirect()
            ->route('sale-returns.show', $returnId)
            ->with('success', 'Return created. Mark as completed to restock.');
    }

    public function show(SaleReturn $saleReturn): Response
    {
        $saleReturn->load([
            'sale.branch:id,name',
            'sale.warehouse:id,name',
            'customer:id,name,code',
            'warehouse:id,name',
            'creator:id,name',
            'items.product:id,name,slug',
            'items.saleItem:id,sale_id',
        ]);

        return Inertia::render('Sale/Return/Show', [
            'saleReturn' => $saleReturn,
        ]);
    }

    public function complete(SaleReturn $saleReturn, InventoryService $inventory): RedirectResponse
    {
        if ($saleReturn->status !== 'pending') {
            return redirect()
                ->route('sale-returns.show', $saleReturn->id)
                ->with('error', 'Only a pending return can be completed.');
        }

        try {
            DB::transaction(function () use ($saleReturn, $inventory): void {
                $inventory->completeSaleReturn($saleReturn);
                $saleReturn->update(['status' => 'completed']);
            });
        } catch (RuntimeException $e) {
            return redirect()
                ->route('sale-returns.show', $saleReturn->id)
                ->with('error', $e->getMessage());
        }

        return redirect()
            ->route('sale-returns.show', $saleReturn->id)
            ->with('success', 'Return completed; stock has been restocked.');
    }

    public function destroy(SaleReturn $saleReturn): RedirectResponse
    {
        if ($saleReturn->status === 'completed') {
            return redirect()
                ->route('sale-returns.index')
                ->with('error', 'Completed returns cannot be deleted.');
        }

        $saleReturn->items()->delete();
        $saleReturn->delete();

        return redirect()
            ->route('sale-returns.index')
            ->with('success', 'Return removed.');
    }

    private function remainingForSaleItem(SaleItem $saleItem): float
    {
        $sold = (float) $saleItem->quantity;
        $returned = (float) SaleReturnItem::query()
            ->where('sale_item_id', $saleItem->id)
            ->whereHas('saleReturn', function ($q) {
                $q->whereIn('status', ['pending', 'completed']);
            })
            ->sum('quantity');

        return max(0, $sold - $returned);
    }

    private function nextReturnNumber(): string
    {
        $prefix = 'RTN-'.now()->format('Ymd').'-';
        $count = (int) SaleReturn::query()
            ->where('return_number', 'like', $prefix.'%')
            ->lockForUpdate()
            ->count();

        return $prefix.str_pad((string) ($count + 1), 5, '0', STR_PAD_LEFT);
    }
}
