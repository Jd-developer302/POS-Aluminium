<?php

namespace App\Http\Controllers\Sale;

use App\Http\Controllers\Controller;
use App\Models\Company\Branch;
use App\Models\Company\Warehouse;
use App\Models\Product\Product;
use App\Models\Product\ProductVarient;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\Setting;
use App\Models\Stock;
use App\Models\Supplier\Customer;
use App\Services\InventoryService;
use App\Support\LengthBillingPairs;
use App\Support\StockLocator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use RuntimeException;

class SaleController extends Controller
{
    public function index()
    {
        $sales = Sale::query()
            ->with(['branch:id,name', 'warehouse:id,name', 'customer:id,name,code'])
            ->latest('sale_date')
            ->paginate(15);

        return Inertia::render('Sale/Index', [
            'sales' => $sales,
        ]);
    }

    public function create()
    {
        $branches = Branch::query()->where('status', 'active')->get(['id', 'name']);
        $warehouses = Warehouse::query()->where('status', 'active')->get(['id', 'name', 'branch_id']);
        $customers = Customer::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $products = $this->saleFormProducts();

        return Inertia::render('Sale/Create', [
            'branches' => $branches,
            'warehouses' => $warehouses,
            'customers' => $customers,
            'products' => $products,
            'invoice_prefix' => Setting::invoicePrefix(),
        ]);
    }

    public function stockAvailability(Request $request)
    {
        $validated = $request->validate([
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'product_id' => ['required', 'exists:products,id'],
            'product_variant_id' => [
                'nullable',
                Rule::exists('product_varients', 'id')->where(
                    fn ($q) => $q->where('product_id', $request->input('product_id'))
                ),
            ],
        ]);

        $warehouse = Warehouse::query()->findOrFail($validated['warehouse_id']);
        $product = Product::query()->findOrFail($validated['product_id']);

        $stocks = Stock::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('product_id', $product->id)
            ->when(
                ! empty($validated['product_variant_id']),
                fn ($q) => $q->where('product_variant_id', $validated['product_variant_id'])
            )
            ->with(['productVarient:id,product_id,name,sku'])
            ->orderBy('product_variant_id')
            ->get();

        return response()->json([
            'product_name' => $product->name,
            'warehouse_name' => $warehouse->name,
            'rows' => $stocks->map(fn (Stock $stock): array => $this->saleStockAvailabilityRow($stock))->values()->all(),
        ]);
    }

    public function store(Request $request, InventoryService $inventory)
    {
        $validated = $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'customer_id' => [
                'nullable',
                Rule::exists('customers', 'id')
                    ->whereNull('deleted_at')
                    ->where('status', 'active'),
            ],
            'sale_date' => ['required', 'date'],
            'status' => ['required', 'in:draft,completed'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.product_variant_id' => ['nullable', 'exists:product_varients,id'],
            'items.*.billing_mode' => ['nullable', Rule::in(['quantity', 'length_ft'])],
            'items.*.length_pairs' => ['nullable', 'array'],
            'items.*.length_pairs.*.length' => ['nullable', 'numeric', 'min:0'],
            'items.*.length_pairs.*.qty' => ['nullable', 'numeric', 'min:0'],
            'items.*.rate_per_ft' => ['nullable', 'numeric', 'min:0'],
            'items.*.discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.quantity' => ['required', 'numeric', 'min:0'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $productsForItems = Product::query()
            ->whereIn('id', collect($validated['items'])->pluck('product_id')->unique()->all())
            ->get()
            ->keyBy('id');

        foreach ($validated['items'] as $it) {
            $product = $productsForItems->get($it['product_id']);
            if (! $product || $product->type !== 'variable') {
                // simple product: no variant required
            } else {
                $vid = $it['product_variant_id'] ?? null;
                if ($vid === null || $vid === '') {
                    return redirect()
                        ->back()
                        ->withInput()
                        ->with(
                            'error',
                            'Select a variant (SKU) for each variable product line. Stock is tracked per variant: '.$product->name.'.'
                        );
                }
                $ok = ProductVarient::query()
                    ->where('id', $vid)
                    ->where('product_id', $product->id)
                    ->where('status', 'active')
                    ->exists();
                if (! $ok) {
                    return redirect()
                        ->back()
                        ->withInput()
                        ->with('error', 'Invalid or inactive variant for product: '.$product->name.'.');
                }
            }

            $mode = $it['billing_mode'] ?? 'quantity';
            if ($mode === 'length_ft') {
                $pairsRaw = is_array($it['length_pairs'] ?? null) ? $it['length_pairs'] : [];
                $pairs = LengthBillingPairs::normalizeLengthPairsForStorage($pairsRaw);
                $totalFt = LengthBillingPairs::totalFeetFromLengthPairs($pairs);
                if ($totalFt <= 0) {
                    return redirect()
                        ->back()
                        ->withInput()
                        ->with('error', 'Length billing: total feet must be greater than zero (check length × qty rows).');
                }
                $rate = (float) ($it['rate_per_ft'] ?? $it['unit_price'] ?? 0);
                if ($rate <= 0) {
                    return redirect()
                        ->back()
                        ->withInput()
                        ->with('error', 'Length billing: rate per ft must be greater than zero.');
                }
            } elseif ((float) ($it['quantity'] ?? 0) < 0.0001) {
                return redirect()
                    ->back()
                    ->withInput()
                    ->with('error', 'Each line must have a quantity greater than zero (or use length billing).');
            }
        }

        try {
            /** @var Sale $sale */
            $sale = DB::transaction(function () use ($validated, $inventory): Sale {
                $saleNumber = $this->generateUniqueSaleNumber((int) $validated['branch_id']);

                $sale = Sale::create([
                    'branch_id' => $validated['branch_id'],
                    'warehouse_id' => $validated['warehouse_id'],
                    'customer_id' => $validated['customer_id'] ?? null,
                    'created_by' => Auth::id(),
                    'sale_number' => $saleNumber,
                    'sale_date' => $validated['sale_date'],
                    'status' => $validated['status'],
                    'payment_status' => 'unpaid',
                    'subtotal' => 0,
                    'tax_amount' => 0,
                    'discount_amount' => 0,
                    'shipping_cost' => 0,
                    'total' => 0,
                    'paid_amount' => 0,
                    'due_amount' => 0,
                    'notes' => $validated['notes'] ?? null,
                ]);

                $productIds = collect($validated['items'])->pluck('product_id')->unique()->values()->all();
                $productsById = Product::query()
                    ->with(['tax:id,rate,type,status'])
                    ->whereIn('id', $productIds)
                    ->get()
                    ->keyBy('id');

                $subtotal = 0.0;
                $taxTotal = 0.0;
                $discountTotal = 0.0;
                foreach ($validated['items'] as $it) {
                    $product = $productsById->get($it['product_id']);

                    $taxRate = 0.0;
                    if ($product?->tax && $product->tax->status === 'active' && $product->tax->type === 'percentage') {
                        $taxRate = (float) $product->tax->rate;
                    }

                    $billingMode = ($it['billing_mode'] ?? 'quantity') === 'length_ft' ? 'length_ft' : 'quantity';

                    if ($billingMode === 'length_ft') {
                        $pairs = is_array($it['length_pairs'] ?? null) ? $it['length_pairs'] : [];
                        $normalizedPairs = LengthBillingPairs::normalizeLengthPairsForStorage($pairs);
                        $totalFt = LengthBillingPairs::totalFeetFromLengthPairs($normalizedPairs);
                        $rate = round((float) ($it['rate_per_ft'] ?? $it['unit_price'] ?? 0), 2);
                        $gross = round($totalFt * $rate, 2);
                        $pct = isset($it['discount_percent']) ? (float) $it['discount_percent'] : 0.0;
                        $pct = min(100.0, max(0.0, $pct));
                        $discountAmt = round($gross * $pct / 100, 2);
                        $lineSubtotal = round(max(0.0, $gross - $discountAmt), 2);
                        $qtyForStock = $totalFt;
                        $unitPriceStored = $rate;
                    } else {
                        $normalizedPairs = null;
                        $qtyForStock = (float) $it['quantity'];
                        $unitPriceStored = (float) $it['unit_price'];
                        $discountAmt = 0.0;
                        $lineSubtotal = round($qtyForStock * $unitPriceStored, 2);
                    }

                    $subtotal += $lineSubtotal;
                    $discountTotal += $discountAmt;

                    $lineTax = round($lineSubtotal * ($taxRate / 100), 2);
                    $taxTotal += $lineTax;

                    $lineProduct = $productsById->get($it['product_id']);
                    $lineVariantId = (int) ($it['product_variant_id'] ?? 0) ?: null;

                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $it['product_id'],
                        'product_variant_id' => $lineVariantId,
                        'billing_mode' => $billingMode,
                        'length_pairs' => $normalizedPairs,
                        'quantity' => $qtyForStock,
                        'unit_price' => $unitPriceStored,
                        'subtotal' => $lineSubtotal,
                        'tax_rate' => $taxRate,
                        'tax_amount' => $lineTax,
                        'discount' => $discountAmt,
                    ]);
                }

                $grandTotal = round($subtotal + $taxTotal, 2);

                $sale->update([
                    'subtotal' => $subtotal,
                    'tax_amount' => round($taxTotal, 2),
                    'discount_amount' => round($discountTotal, 2),
                    'total' => $grandTotal,
                    'due_amount' => $grandTotal,
                ]);

                if ($sale->status === 'completed') {
                    $this->resolveSaleLineVariantsFromStock($sale);
                    $sale->load('items');
                    $inventory->withContext([
                        'source_type' => 'sale',
                        'source_id' => (int) $sale->id,
                        'reference' => (string) $sale->sale_number,
                        'created_by' => Auth::id(),
                        'notes' => 'Sale completed',
                    ])->completeSale($sale);
                    $sale->refresh();
                }

                return $sale;
            });
        } catch (RuntimeException $e) {
            return redirect()
                ->back()
                ->withInput()
                ->with('error', $e->getMessage());
        }

        return redirect()
            ->route('sales.show', $sale->id)
            ->with('success', 'Sale created successfully.');
    }

    /**
     * Finalize a draft sale: deduct stock like a completed sale created with status completed.
     */
    public function complete(Sale $sale, InventoryService $inventory)
    {
        if ($sale->status !== 'draft') {
            return redirect()
                ->route('sales.show', $sale->id)
                ->with('error', 'Only draft sales can be marked completed this way.');
        }

        try {
            DB::transaction(function () use ($sale, $inventory): void {
                $sale->loadMissing('items');
                $this->resolveSaleLineVariantsFromStock($sale);
                $sale->load('items');
                $inventory->withContext([
                    'source_type' => 'sale',
                    'source_id' => (int) $sale->id,
                    'reference' => (string) $sale->sale_number,
                    'created_by' => Auth::id(),
                    'notes' => 'Sale completed',
                ])->completeSale($sale);
                $sale->update(['status' => 'completed']);
            });
        } catch (RuntimeException $e) {
            return redirect()
                ->route('sales.show', $sale->id)
                ->with('error', $e->getMessage());
        }

        return redirect()
            ->route('sales.show', $sale->id)
            ->with('success', 'Sale marked as completed and stock updated.');
    }

    public function show(Sale $sale)
    {
        $sale->load([
            'branch:id,name',
            'warehouse:id,name',
            'customer:id,name,code,email,phone',
            'items.product:id,name,type',
            'items.productVarient:id,product_id,sku,name',
            'payments',
        ]);

        return Inertia::render('Sale/Show', [
            'sale' => $sale,
        ]);
    }

    public function addPayment(Request $request, Sale $sale)
    {
        $validated = $request->validate([
            'payment_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'in:cash,bank_transfer,cheque,card,other'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($sale, $validated): void {
            SalePayment::create([
                'sale_id' => $sale->id,
                'created_by' => Auth::id(),
                'payment_number' => 'PAY-'.now()->format('YmdHis').'-'.$sale->id,
                'payment_date' => $validated['payment_date'],
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'reference_number' => $validated['reference_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            $paid = (float) SalePayment::query()
                ->where('sale_id', $sale->id)
                ->sum('amount');

            $due = max(0, (float) $sale->total - $paid);
            $paymentStatus = $due <= 0 ? 'paid' : ($paid > 0 ? 'partial' : 'unpaid');

            $sale->update([
                'paid_amount' => $paid,
                'due_amount' => $due,
                'payment_status' => $paymentStatus,
            ]);
        });

        return redirect()
            ->route('sales.show', $sale->id)
            ->with('success', 'Payment added successfully.');
    }

    public function receipt(Sale $sale)
    {
        $sale->load([
            'branch:id,name',
            'warehouse:id,name',
            'customer:id,name,code,email,phone',
            'items.product:id,name,type',
            'items.productVarient:id,product_id,sku,name',
            'payments',
        ]);

        return Inertia::render('Sale/Receipt', [
            'sale' => $sale,
        ]);
    }

    public function returnSale(Request $request, Sale $sale, InventoryService $inventory)
    {
        $request->validate([
            'confirm' => ['required', 'boolean'],
        ]);

        if ($sale->status !== 'completed') {
            return redirect()
                ->route('sales.show', $sale->id)
                ->with('error', 'Only completed sales can be returned.');
        }
        if ($sale->status === 'returned') {
            return redirect()
                ->route('sales.show', $sale->id)
                ->with('error', 'This sale is already returned.');
        }

        $inventory->withContext([
            'source_type' => 'sale_return',
            'source_id' => (int) $sale->id,
            'reference' => (string) $sale->sale_number,
            'created_by' => Auth::id(),
            'notes' => 'Sale returned',
        ])->returnSale($sale);
        $sale->update(['status' => 'returned']);

        return redirect()
            ->route('sales.show', $sale->id)
            ->with('success', 'Sale returned and stock restored.');
    }

    public function destroy(Sale $sale, InventoryService $inventory): RedirectResponse
    {
        try {
            DB::transaction(function () use ($sale, $inventory): void {
                $sale->loadMissing(['items', 'payments', 'saleReturns']);

                if ($sale->saleReturns()->where('status', 'completed')->exists()) {
                    throw new RuntimeException(
                        'This sale has completed returns. Delete those returns first.'
                    );
                }

                foreach ($sale->saleReturns as $return) {
                    $return->items()->delete();
                    $return->delete();
                }

                if ($sale->status === 'completed') {
                    $inventory->withContext([
                        'source_type' => 'sale',
                        'source_id' => (int) $sale->id,
                        'reference' => (string) $sale->sale_number,
                        'created_by' => Auth::id(),
                        'notes' => 'Sale deleted — stock restored',
                    ])->returnSale($sale);
                }

                $sale->payments()->delete();
                $sale->items()->delete();
                $sale->delete();
            });
        } catch (RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }

        return redirect()
            ->back()
            ->with('success', 'Sale deleted successfully.');
    }

    private function generateUniqueSaleNumber(int $branchId): string
    {
        $prefix = Setting::invoicePrefix();

        for ($attempt = 0; $attempt < 25; $attempt++) {
            $candidate = $prefix.'-'.strtoupper(str_replace('.', '', uniqid('', true)));
            if (strlen($candidate) > 100) {
                $candidate = substr($candidate, 0, 100);
            }

            $exists = Sale::query()
                ->where('branch_id', $branchId)
                ->where('sale_number', $candidate)
                ->exists();

            if (! $exists) {
                return $candidate;
            }
        }

        throw new RuntimeException('Could not generate a unique sale number. Try again.');
    }

    /**
     * Draft lines without variant: if warehouse stock is stored on a single SKU row, attach it before deducting.
     */
    private function resolveSaleLineVariantsFromStock(Sale $sale): void
    {
        foreach ($sale->items as $item) {
            if ($item->product_variant_id) {
                continue;
            }

            $stock = StockLocator::findLocked(
                (int) $sale->warehouse_id,
                (int) $item->product_id,
                null,
            );

            if ($stock?->product_variant_id) {
                $item->update(['product_variant_id' => $stock->product_variant_id]);
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function saleStockAvailabilityRow(Stock $stock): array
    {
        $billing = (string) ($stock->billing_mode ?? 'quantity');
        $available = round((float) $stock->quantity - (float) $stock->reserved_quantity, 4);
        $lengthSummary = '';
        $lengthPairsSumFt = null;

        if ($billing === 'length_ft') {
            $raw = is_array($stock->length_pairs) ? $stock->length_pairs : [];
            $normalized = LengthBillingPairs::normalizeLengthPairsForStorage($raw);
            $lengthPairsSumFt = LengthBillingPairs::totalFeetFromLengthPairs($normalized);
            $lengthSummary = $this->lengthPairsSummaryForSale($raw);
        }

        $variant = $stock->productVarient;
        $variantLabel = $variant
            ? trim((($variant->sku ? (string) $variant->sku.' — ' : '').(string) ($variant->name ?? '')))
            : '—';

        return [
            'variant_id' => $stock->product_variant_id,
            'variant_label' => $variantLabel,
            'billing_mode' => $billing,
            'quantity_on_hand' => (float) $stock->quantity,
            'reserved_quantity' => (float) $stock->reserved_quantity,
            'available_quantity' => $available,
            'length_pairs_summary' => $lengthSummary,
            'length_pairs_sum_ft' => $lengthPairsSumFt,
            'status' => (string) $stock->status,
        ];
    }

    /**
     * @param  array<int, mixed>|null  $pairs
     */
    private function lengthPairsSummaryForSale(?array $pairs): string
    {
        if (! is_array($pairs) || $pairs === []) {
            return '';
        }
        $parts = [];
        foreach ($pairs as $row) {
            if (! is_array($row)) {
                continue;
            }
            $l = (float) ($row['length'] ?? 0);
            $q = (float) ($row['qty'] ?? 0);
            if ($l <= 0 && $q <= 0) {
                continue;
            }
            $parts[] = $l.'×'.$q;
        }

        return $parts !== [] ? implode(' + ', $parts) : '';
    }

    /**
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    private function saleFormProducts()
    {
        return Product::query()
            ->where('status', 'active')
            ->with([
                'tax:id,rate,type,status',
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
            ->get(['id', 'name', 'slug', 'type', 'tax_id'])
            ->map(static function (Product $p): array {
                $rate = 0.0;
                if ($p->tax && $p->tax->status === 'active' && $p->tax->type === 'percentage') {
                    $rate = (float) $p->tax->rate;
                }

                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'type' => $p->type,
                    'tax_percentage' => $rate,
                    'variants' => $p->varients
                        ->map(static function (ProductVarient $v): array {
                            return [
                                'id' => $v->id,
                                'sku' => $v->sku,
                                'name' => $v->name,
                                'selling_price' => (float) $v->selling_price,
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
