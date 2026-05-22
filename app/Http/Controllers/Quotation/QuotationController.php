<?php

namespace App\Http\Controllers\Quotation;

use App\Http\Controllers\Controller;
use App\Models\Company\Branch;
use App\Models\Company\Warehouse;
use App\Models\Product\Product;
use App\Models\Product\ProductVarient;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\Setting;
use App\Models\Supplier\Customer;
use App\Support\LengthBillingPairs;
use App\Support\QuotationDisplayRows;
use Barryvdh\DomPDF\PDF;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use RuntimeException;

class QuotationController extends Controller
{
    public function index()
    {
        $quotations = Quotation::query()
            ->with(['branch:id,name', 'warehouse:id,name', 'customer:id,name,code'])
            ->latest('quotation_date')
            ->latest('id')
            ->paginate(15);

        return Inertia::render('Quotation/Index', [
            'quotations' => $quotations,
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

        $products = $this->quotationFormProducts();

        return Inertia::render('Quotation/Create', [
            'branches' => $branches,
            'warehouses' => $warehouses,
            'customers' => $customers,
            'products' => $products,
            'invoice_prefix' => Setting::invoicePrefix(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateQuotationRequest($request);

        $this->assertWarehouseInBranch((int) $validated['branch_id'], (int) $validated['warehouse_id']);

        $productsForItems = Product::query()
            ->whereIn('id', collect($validated['items'])->pluck('product_id')->unique()->all())
            ->get()
            ->keyBy('id');

        foreach ($validated['items'] as $it) {
            $this->assertItemProductVariant($it, $productsForItems);
        }

        foreach ($validated['items'] as $it) {
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
            $quotation = DB::transaction(function () use ($validated): Quotation {
                $no = $this->generateUniqueQuotationNumber((int) $validated['branch_id']);

                $quotation = Quotation::create([
                    'branch_id' => $validated['branch_id'],
                    'warehouse_id' => $validated['warehouse_id'],
                    'customer_id' => $validated['customer_id'] ?? null,
                    'created_by' => Auth::id(),
                    'quotation_no' => $no,
                    'quotation_date' => $validated['quotation_date'],
                    'valid_until' => $validated['valid_until'] ?? null,
                    'status' => $validated['status'],
                    'subtotal' => 0,
                    'discount_value' => 0,
                    'discount_amount' => $validated['discount_amount'] ?? 0,
                    'shipping_amount' => $validated['shipping_amount'] ?? 0,
                    'tax_amount' => 0,
                    'total' => 0,
                    'notes' => $validated['notes'] ?? null,
                    'converted_sale_id' => null,
                ]);

                $productIds = collect($validated['items'])->pluck('product_id')->unique()->values()->all();
                $productsById = Product::query()
                    ->with(['tax:id,rate,type,status'])
                    ->whereIn('id', $productIds)
                    ->get()
                    ->keyBy('id');

                $sumSubtotal = 0.0;
                $sumTax = 0.0;
                $sumLineTotal = 0.0;

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
                        $lineDiscountAmt = round($gross * $pct / 100, 2);
                        $lineSubtotal = round(max(0.0, $gross - $lineDiscountAmt), 2);
                        $qtyStored = $totalFt;
                        $unitPriceStored = $rate;
                        $discountType = $pct > 0 ? 'percent' : null;
                        $discountValue = $pct;
                    } else {
                        $normalizedPairs = null;
                        $qtyStored = (float) $it['quantity'];
                        $unitPriceStored = (float) $it['unit_price'];
                        $lineDiscountAmt = 0.0;
                        $lineSubtotal = round($qtyStored * $unitPriceStored, 2);
                        $discountType = null;
                        $discountValue = 0.0;
                    }

                    $lineTax = round($lineSubtotal * ($taxRate / 100), 2);
                    $lineTotal = round($lineSubtotal + $lineTax, 2);

                    $sumSubtotal += $lineSubtotal;
                    $sumTax += $lineTax;
                    $sumLineTotal += $lineTotal;

                    $lineProduct = $productsById->get($it['product_id']);
                    $lineVariantId = null;
                    if ($lineProduct && $lineProduct->type === 'variable') {
                        $lineVariantId = (int) ($it['product_variant_id'] ?? 0) ?: null;
                    }

                    QuotationItem::create([
                        'quotation_id' => $quotation->id,
                        'product_id' => $it['product_id'],
                        'product_variant_id' => $lineVariantId,
                        'product_batch_id' => null,
                        'billing_mode' => $billingMode,
                        'length_pairs' => $normalizedPairs ?? null,
                        'quantity' => $qtyStored,
                        'unit_price' => $unitPriceStored,
                        'tax_rate' => $taxRate,
                        'tax_amount' => $lineTax,
                        'discount_type' => $discountType,
                        'discount_value' => $discountValue ?? 0,
                        'discount_amount' => $lineDiscountAmt,
                        'subtotal' => $lineSubtotal,
                        'line_total' => $lineTotal,
                        'notes' => null,
                    ]);
                }

                $shipping = round((float) ($validated['shipping_amount'] ?? 0), 2);
                $docDiscount = round((float) ($validated['discount_amount'] ?? 0), 2);
                $grandTotal = round($sumLineTotal + $shipping - $docDiscount, 2);

                $quotation->update([
                    'subtotal' => round($sumSubtotal, 2),
                    'tax_amount' => round($sumTax, 2),
                    'shipping_amount' => $shipping,
                    'discount_amount' => $docDiscount,
                    'total' => max(0.0, $grandTotal),
                ]);

                return $quotation;
            });
        } catch (RuntimeException $e) {
            return redirect()
                ->back()
                ->withInput()
                ->with('error', $e->getMessage());
        }

        return redirect()
            ->route('quotations.show', $quotation->id)
            ->with('success', 'Quotation created.');
    }

    public function show(Quotation $quotation)
    {
        $quotation->load([
            'branch:id,name',
            'warehouse:id,name',
            'customer:id,name,code,email,phone',
            'items.product:id,name,type',
            'items.productVarient:id,product_id,sku,name',
        ]);

        return Inertia::render('Quotation/Show', [
            'quotation' => $quotation,
        ]);
    }

    public function pdf(Quotation $quotation)
    {
        $quotation->load([
            'branch:id,name',
            'warehouse:id,name',
            'customer:id,name,code,email,phone',
            'items.product:id,name,type',
            'items.productVarient:id,product_id,sku,name',
        ]);

        $rows = QuotationDisplayRows::expand($quotation->items);

        try {
            /** @var PDF $generator */
            $generator = app()->make('dompdf.wrapper');
            $safeNo = preg_replace('/[^A-Za-z0-9._-]+/', '_', (string) $quotation->quotation_no) ?: 'quotation';
            $filename = 'quotation-'.$safeNo.'.pdf';

            return $generator
                ->loadView('quotations.pdf', [
                    'quotation' => $quotation,
                    'rows' => $rows,
                    'invoiceLogoPath' => Setting::invoiceLogoPathForPdf(),
                ])
                ->setPaper('a4', 'portrait')
                ->download($filename);
        } catch (\Throwable $e) {
            report($e);

            return redirect()
                ->route('quotations.show', $quotation)
                ->with('error', 'PDF generation failed. Ensure dompdf is installed and PHP has the dom extension.');
        }
    }

    public function edit(Quotation $quotation)
    {
        if (in_array($quotation->status, ['converted'], true)) {
            return redirect()
                ->route('quotations.show', $quotation)
                ->with('error', 'Converted quotations cannot be edited.');
        }

        $quotation->load(['items']);

        $branches = Branch::query()->where('status', 'active')->get(['id', 'name']);
        $warehouses = Warehouse::query()->where('status', 'active')->get(['id', 'name', 'branch_id']);
        $customers = Customer::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $products = $this->quotationFormProducts();

        $items = $quotation->items->map(function (QuotationItem $row) {
            $mode = $row->billing_mode === 'length_ft' ? 'length_ft' : 'quantity';
            $pairs = $row->length_pairs;
            if (! is_array($pairs)) {
                $pairs = [];
            }
            $padded = [];
            for ($i = 0; $i < 4; $i++) {
                $r = $pairs[$i] ?? null;
                $padded[] = [
                    'length' => isset($r['length']) ? (string) $r['length'] : '',
                    'qty' => isset($r['qty']) ? (string) $r['qty'] : '',
                ];
            }
            $pct = '0';
            if ($row->discount_type === 'percent' && (float) $row->discount_value > 0) {
                $pct = (string) $row->discount_value;
            }

            return [
                'product_id' => $row->product_id,
                'product_variant_id' => $row->product_variant_id ?? '',
                'billing_mode' => $mode,
                'length_pairs' => $padded,
                'rate_per_ft' => $mode === 'length_ft' ? (string) $row->unit_price : '',
                'discount_percent' => $pct,
                'quantity' => (string) $row->quantity,
                'unit_price' => $mode === 'length_ft' ? (string) $row->unit_price : (float) $row->unit_price,
            ];
        })->values()->all();

        return Inertia::render('Quotation/Edit', [
            'quotation' => $quotation,
            'branches' => $branches,
            'warehouses' => $warehouses,
            'customers' => $customers,
            'products' => $products,
            'invoice_prefix' => Setting::invoicePrefix(),
            'initialItems' => $items,
        ]);
    }

    public function update(Request $request, Quotation $quotation)
    {
        if (in_array($quotation->status, ['converted'], true)) {
            return redirect()
                ->route('quotations.show', $quotation)
                ->with('error', 'Converted quotations cannot be edited.');
        }

        $validated = $this->validateQuotationRequest($request);

        $this->assertWarehouseInBranch((int) $validated['branch_id'], (int) $validated['warehouse_id']);

        $productsForItems = Product::query()
            ->whereIn('id', collect($validated['items'])->pluck('product_id')->unique()->all())
            ->get()
            ->keyBy('id');

        foreach ($validated['items'] as $it) {
            $this->assertItemProductVariant($it, $productsForItems);
        }

        foreach ($validated['items'] as $it) {
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
            DB::transaction(function () use ($validated, $quotation): void {
                $quotation->update([
                    'branch_id' => $validated['branch_id'],
                    'warehouse_id' => $validated['warehouse_id'],
                    'customer_id' => $validated['customer_id'] ?? null,
                    'quotation_date' => $validated['quotation_date'],
                    'valid_until' => $validated['valid_until'] ?? null,
                    'status' => $validated['status'],
                    'notes' => $validated['notes'] ?? null,
                    'shipping_amount' => $validated['shipping_amount'] ?? 0,
                    'discount_amount' => $validated['discount_amount'] ?? 0,
                ]);

                $quotation->items()->forceDelete();

                $productIds = collect($validated['items'])->pluck('product_id')->unique()->values()->all();
                $productsById = Product::query()
                    ->with(['tax:id,rate,type,status'])
                    ->whereIn('id', $productIds)
                    ->get()
                    ->keyBy('id');

                $sumSubtotal = 0.0;
                $sumTax = 0.0;
                $sumLineTotal = 0.0;

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
                        $lineDiscountAmt = round($gross * $pct / 100, 2);
                        $lineSubtotal = round(max(0.0, $gross - $lineDiscountAmt), 2);
                        $qtyStored = $totalFt;
                        $unitPriceStored = $rate;
                        $discountType = $pct > 0 ? 'percent' : null;
                        $discountValue = $pct;
                    } else {
                        $normalizedPairs = null;
                        $qtyStored = (float) $it['quantity'];
                        $unitPriceStored = (float) $it['unit_price'];
                        $lineDiscountAmt = 0.0;
                        $lineSubtotal = round($qtyStored * $unitPriceStored, 2);
                        $discountType = null;
                        $discountValue = 0.0;
                    }

                    $lineTax = round($lineSubtotal * ($taxRate / 100), 2);
                    $lineTotal = round($lineSubtotal + $lineTax, 2);

                    $sumSubtotal += $lineSubtotal;
                    $sumTax += $lineTax;
                    $sumLineTotal += $lineTotal;

                    $lineProduct = $productsById->get($it['product_id']);
                    $lineVariantId = null;
                    if ($lineProduct && $lineProduct->type === 'variable') {
                        $lineVariantId = (int) ($it['product_variant_id'] ?? 0) ?: null;
                    }

                    QuotationItem::create([
                        'quotation_id' => $quotation->id,
                        'product_id' => $it['product_id'],
                        'product_variant_id' => $lineVariantId,
                        'product_batch_id' => null,
                        'billing_mode' => $billingMode,
                        'length_pairs' => $normalizedPairs ?? null,
                        'quantity' => $qtyStored,
                        'unit_price' => $unitPriceStored,
                        'tax_rate' => $taxRate,
                        'tax_amount' => $lineTax,
                        'discount_type' => $discountType,
                        'discount_value' => $discountValue ?? 0,
                        'discount_amount' => $lineDiscountAmt,
                        'subtotal' => $lineSubtotal,
                        'line_total' => $lineTotal,
                        'notes' => null,
                    ]);
                }

                $shipping = round((float) ($validated['shipping_amount'] ?? 0), 2);
                $docDiscount = round((float) ($validated['discount_amount'] ?? 0), 2);
                $grandTotal = round($sumLineTotal + $shipping - $docDiscount, 2);

                $quotation->update([
                    'subtotal' => round($sumSubtotal, 2),
                    'tax_amount' => round($sumTax, 2),
                    'shipping_amount' => $shipping,
                    'discount_amount' => $docDiscount,
                    'total' => max(0.0, $grandTotal),
                ]);
            });
        } catch (RuntimeException $e) {
            return redirect()
                ->back()
                ->withInput()
                ->with('error', $e->getMessage());
        }

        return redirect()
            ->route('quotations.show', $quotation->id)
            ->with('success', 'Quotation updated.');
    }

    public function destroy(Quotation $quotation)
    {
        if ($quotation->status === 'converted') {
            return redirect()
                ->route('quotations.index')
                ->with('error', 'Cannot delete a converted quotation.');
        }

        DB::transaction(function () use ($quotation): void {
            $quotation->items()->each(fn (QuotationItem $i) => $i->delete());
            $quotation->delete();
        });

        return redirect()
            ->route('quotations.index')
            ->with('success', 'Quotation deleted.');
    }

    public function destroyItem(QuotationItem $quotationItem): RedirectResponse
    {
        $quotation = $quotationItem->quotation()->first();
        if ($quotation === null) {
            return redirect()->back()->with('error', 'Quotation not found for this line.');
        }

        if ($quotation->status === 'converted') {
            return redirect()->back()->with('error', 'Cannot delete lines from a converted quotation.');
        }

        DB::transaction(function () use ($quotationItem, $quotation): void {
            $quotationItem->delete();

            $items = $quotation->items()->get();
            $sumSubtotal = round((float) $items->sum('subtotal'), 2);
            $sumTax = round((float) $items->sum('tax_amount'), 2);
            $sumLineTotal = round((float) $items->sum('line_total'), 2);
            $shipping = round((float) $quotation->shipping_amount, 2);
            $docDiscount = round((float) $quotation->discount_amount, 2);
            $grandTotal = round($sumLineTotal + $shipping - $docDiscount, 2);

            $quotation->update([
                'subtotal' => $sumSubtotal,
                'tax_amount' => $sumTax,
                'total' => max(0.0, $grandTotal),
            ]);
        });

        return redirect()->back()->with('success', 'Quotation line deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validateQuotationRequest(Request $request): array
    {
        return $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'customer_id' => [
                'nullable',
                Rule::exists('customers', 'id')
                    ->whereNull('deleted_at')
                    ->where('status', 'active'),
            ],
            'quotation_date' => ['required', 'date'],
            'valid_until' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['draft', 'sent', 'accepted', 'rejected', 'expired'])],
            'notes' => ['nullable', 'string'],
            'shipping_amount' => ['nullable', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
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
    }

    private function assertWarehouseInBranch(int $branchId, int $warehouseId): void
    {
        $ok = Warehouse::query()
            ->where('id', $warehouseId)
            ->where('branch_id', $branchId)
            ->exists();
        if (! $ok) {
            throw new HttpResponseException(
                redirect()->back()->withInput()->with(
                    'error',
                    'Selected warehouse does not belong to the selected branch.',
                ),
            );
        }
    }

    /**
     * @param  array<string, mixed>  $it
     * @param  Collection<int, Product>  $productsForItems
     */
    private function assertItemProductVariant(array $it, $productsForItems): void
    {
        $product = $productsForItems->get($it['product_id']);
        if (! $product || $product->type !== 'variable') {
            return;
        }
        $vid = $it['product_variant_id'] ?? null;
        if ($vid === null || $vid === '') {
            throw new HttpResponseException(
                redirect()->back()->withInput()->with(
                    'error',
                    'Select a variant (SKU) for each variable product: '.$product->name.'.',
                ),
            );
        }
        $ok = ProductVarient::query()
            ->where('id', $vid)
            ->where('product_id', $product->id)
            ->where('status', 'active')
            ->exists();
        if (! $ok) {
            throw new HttpResponseException(
                redirect()->back()->withInput()->with(
                    'error',
                    'Invalid or inactive variant for product: '.$product->name.'.',
                ),
            );
        }
    }

    private function generateUniqueQuotationNumber(int $branchId): string
    {
        $prefix = Setting::invoicePrefix();

        for ($attempt = 0; $attempt < 25; $attempt++) {
            $candidate = $prefix.'-Q-'.strtoupper(str_replace('.', '', uniqid('', true)));
            if (strlen($candidate) > 100) {
                $candidate = substr($candidate, 0, 100);
            }

            $exists = Quotation::query()
                ->where('branch_id', $branchId)
                ->where('quotation_no', $candidate)
                ->exists();

            if (! $exists) {
                return $candidate;
            }
        }

        throw new RuntimeException('Could not generate a unique quotation number. Try again.');
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function quotationFormProducts()
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
