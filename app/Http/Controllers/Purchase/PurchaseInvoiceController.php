<?php

namespace App\Http\Controllers\Purchase;

use App\Http\Controllers\Controller;
use App\Models\Company\Branch;
use App\Models\Company\Warehouse;
use App\Models\Product\Product;
use App\Models\Product\ProductVarient;
use App\Models\ProductBatch;
use App\Models\PurchaseInvoice;
use App\Models\PurchasePayment;
use App\Models\Setting;
use App\Models\Supplier\Supplier;
use App\Services\InventoryService;
use App\Support\LengthBillingPairs;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseInvoiceController extends Controller
{
    public function index(): Response
    {
        $invoices = PurchaseInvoice::query()
            ->latest('invoice_date')
            ->paginate(15);

        return Inertia::render('Purchase/Invoice/Index', [
            'invoices' => $invoices,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Purchase/Invoice/Create', $this->purchaseInvoiceFormProps());
    }

    public function store(Request $request): RedirectResponse
    {
        $payload = $this->validatedPurchaseInvoicePayload($request, null);

        $invoiceId = null;

        DB::transaction(function () use ($payload, &$invoiceId): void {
            $invoice = PurchaseInvoice::query()->create([
                'branch_id' => $payload['data']['branch_id'],
                'warehouse_id' => $payload['data']['warehouse_id'],
                'supplier_id' => $payload['data']['supplier_id'],
                'purchase_order_id' => null,
                'created_by' => Auth::id(),
                'invoice_number' => $payload['data']['invoice_number'],
                'invoice_date' => $payload['data']['invoice_date'],
                'due_date' => $payload['data']['due_date'] ?? null,
                'status' => 'draft',
                'subtotal' => $payload['subtotalSum'],
                'tax_amount' => $payload['taxSum'],
                'discount_amount' => $payload['invoiceDiscount'],
                'shipping_cost' => $payload['shipping'],
                'total' => $payload['total'],
                'paid_amount' => 0,
                'due_amount' => $payload['total'],
                'received_at' => null,
                'notes' => $payload['data']['notes'] ?? null,
            ]);

            $invoiceId = $invoice->id;

            foreach ($payload['linePayloads'] as $line) {
                $invoice->items()->create($line);
            }
        });

        return redirect()
            ->route('purchase-invoices.show', $invoiceId)
            ->with('success', 'Purchase invoice created. You can receive it when stock should increase.');
    }

    public function edit(PurchaseInvoice $purchase_invoice): Response
    {
        $this->assertPurchaseInvoiceEditable($purchase_invoice);

        $purchase_invoice->load('items');

        return Inertia::render('Purchase/Invoice/Edit', array_merge(
            $this->purchaseInvoiceFormProps(),
            ['invoice' => $purchase_invoice]
        ));
    }

    public function update(Request $request, PurchaseInvoice $purchase_invoice): RedirectResponse
    {
        $this->assertPurchaseInvoiceEditable($purchase_invoice);

        $payload = $this->validatedPurchaseInvoicePayload($request, $purchase_invoice);

        DB::transaction(function () use ($purchase_invoice, $payload): void {
            $paid = (float) $purchase_invoice->paid_amount;
            $due = round(max(0, $payload['total'] - $paid), 2);

            $purchase_invoice->update([
                'branch_id' => $payload['data']['branch_id'],
                'warehouse_id' => $payload['data']['warehouse_id'],
                'supplier_id' => $payload['data']['supplier_id'],
                'invoice_number' => $payload['data']['invoice_number'],
                'invoice_date' => $payload['data']['invoice_date'],
                'due_date' => $payload['data']['due_date'] ?? null,
                'subtotal' => $payload['subtotalSum'],
                'tax_amount' => $payload['taxSum'],
                'discount_amount' => $payload['invoiceDiscount'],
                'shipping_cost' => $payload['shipping'],
                'total' => $payload['total'],
                'due_amount' => $due,
                'notes' => $payload['data']['notes'] ?? null,
            ]);

            $purchase_invoice->items()->each(static function ($item): void {
                $item->forceDelete();
            });

            foreach ($payload['linePayloads'] as $line) {
                $purchase_invoice->items()->create($line);
            }
        });

        return redirect()
            ->route('purchase-invoices.show', $purchase_invoice->id)
            ->with('success', 'Purchase invoice updated.');
    }

    public function destroy(PurchaseInvoice $purchase_invoice): RedirectResponse
    {
        if ($purchase_invoice->received_at !== null || $purchase_invoice->status === 'received') {
            return redirect()
                ->back()
                ->with('error', 'Received invoices cannot be deleted.');
        }

        DB::transaction(function () use ($purchase_invoice): void {
            $purchase_invoice->items()->each(static function ($item): void {
                $item->forceDelete();
            });
            $purchase_invoice->delete();
        });

        return redirect()
            ->back()
            ->with('success', 'Purchase invoice deleted.');
    }

    public function show(PurchaseInvoice $purchase_invoice): Response
    {
        $purchase_invoice->load([
            'branch:id,name',
            'warehouse:id,name',
            'supplier:id,name,code,phone,email',
            'items.product:id,name',
            'items.productVarient:id,product_id,sku,name',
            'payments',
        ]);

        return Inertia::render('Purchase/Invoice/Show', [
            'invoice' => $purchase_invoice,
        ]);
    }

    public function addPayment(Request $request, PurchaseInvoice $purchase_invoice): RedirectResponse
    {
        if ($purchase_invoice->status === 'cancelled') {
            return redirect()
                ->route('purchase-invoices.show', $purchase_invoice->id)
                ->with('error', 'Cancelled invoices cannot accept payments.');
        }

        $validated = $request->validate([
            'payment_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'in:cash,bank_transfer,cheque,card,other'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($purchase_invoice, $validated): void {
            PurchasePayment::create([
                'purchase_invoice_id' => $purchase_invoice->id,
                'created_by' => Auth::id(),
                'payment_number' => 'PPAY-'.now()->format('YmdHis').'-'.$purchase_invoice->id,
                'payment_date' => $validated['payment_date'],
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'reference_number' => $validated['reference_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            $paid = (float) PurchasePayment::query()
                ->where('purchase_invoice_id', $purchase_invoice->id)
                ->sum('amount');

            $due = max(0, round((float) $purchase_invoice->total - $paid, 2));

            $purchase_invoice->update([
                'paid_amount' => $paid,
                'due_amount' => $due,
            ]);
        });

        return redirect()
            ->route('purchase-invoices.show', $purchase_invoice->id)
            ->with('success', 'Payment added successfully.');
    }

    public function voucher(PurchaseInvoice $purchase_invoice): Response
    {
        $purchase_invoice->load([
            'branch:id,name',
            'warehouse:id,name',
            'supplier:id,name,code,phone,email',
            'items.product:id,name,type',
            'items.productVarient:id,product_id,sku,name',
            'payments',
        ]);

        return Inertia::render('Purchase/Invoice/Voucher', [
            'invoice' => $purchase_invoice,
        ]);
    }

    public function receive(Request $request, PurchaseInvoice $purchase_invoice, InventoryService $inventory): RedirectResponse
    {
        $request->validate([
            'confirm' => ['required', 'boolean'],
        ]);

        if ($purchase_invoice->status === 'cancelled') {
            return redirect()
                ->route('purchase-invoices.show', $purchase_invoice->id)
                ->with('error', 'Cancelled invoices cannot be received.');
        }

        if ($purchase_invoice->received_at) {
            return redirect()
                ->route('purchase-invoices.show', $purchase_invoice->id)
                ->with('error', 'This invoice was already received. Stock was not updated again.');
        }

        if ($purchase_invoice->status !== 'received') {
            $purchase_invoice->update([
                'status' => 'received',
                'received_at' => now(),
            ]);
        } else {
            $purchase_invoice->update([
                'received_at' => now(),
            ]);
        }

        $inventory->withContext([
            'source_type' => 'purchase_invoice',
            'source_id' => (int) $purchase_invoice->id,
            'reference' => (string) $purchase_invoice->invoice_number,
            'created_by' => Auth::id(),
            'notes' => 'Invoice received',
        ])->receivePurchaseInvoice($purchase_invoice);

        return redirect()
            ->route('purchase-invoices.show', $purchase_invoice->id)
            ->with('success', 'Invoice received and stock updated.');
    }

    /**
     * @return array<string, mixed>
     */
    private function purchaseInvoiceFormProps(): array
    {
        $suppliers = Supplier::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

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

        return [
            'suppliers' => $suppliers,
            'branches' => $branches,
            'warehouses' => $warehouses,
            'products' => $products,
            'variants' => $variants,
            'batches' => $batches,
            'invoice_prefix' => Setting::invoicePrefix(),
        ];
    }

    private function normalizePurchaseInvoiceRequest(Request $request): void
    {
        $items = collect($request->input('items', []))->map(static function (array $row): array {
            if (array_key_exists('product_variant_id', $row) && $row['product_variant_id'] === '') {
                $row['product_variant_id'] = null;
            }
            if (array_key_exists('product_batch_id', $row) && $row['product_batch_id'] === '') {
                $row['product_batch_id'] = null;
            }

            return $row;
        })->all();

        $request->merge([
            'items' => $items,
            'due_date' => $request->input('due_date') === '' ? null : $request->input('due_date'),
        ]);
    }

    private function assertPurchaseInvoiceEditable(PurchaseInvoice $purchase_invoice): void
    {
        if ($purchase_invoice->received_at !== null) {
            abort(403, 'This invoice can no longer be edited because stock was already received.');
        }

        if ($purchase_invoice->status !== 'draft') {
            abort(403, 'Only draft invoices can be edited.');
        }
    }

    /**
     * @return array{data: array<string, mixed>, linePayloads: list<array<string, mixed>>, subtotalSum: float, taxSum: float, shipping: float, invoiceDiscount: float, total: float}
     */
    private function validatedPurchaseInvoicePayload(Request $request, ?PurchaseInvoice $existing): array
    {
        $this->normalizePurchaseInvoiceRequest($request);

        $data = $request->validate([
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'invoice_number' => ['required', 'string', 'max:255'],
            'invoice_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'shipping_cost' => ['nullable', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.product_variant_id' => ['nullable', 'integer', 'exists:product_varients,id'],
            'items.*.product_batch_id' => ['nullable', 'integer', 'exists:product_batches,id'],
            'items.*.billing_mode' => ['nullable', Rule::in(['quantity', 'length_ft'])],
            'items.*.length_pairs' => ['nullable', 'array'],
            'items.*.length_pairs.*.length' => ['nullable', 'numeric', 'min:0'],
            'items.*.length_pairs.*.qty' => ['nullable', 'numeric', 'min:0'],
            'items.*.quantity' => ['required', 'numeric', 'min:0'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'items.*.discount' => ['nullable', 'numeric', 'min:0'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $warehouse = Warehouse::query()->findOrFail($data['warehouse_id']);
        if ((int) $warehouse->branch_id !== (int) $data['branch_id']) {
            throw ValidationException::withMessages([
                'warehouse_id' => 'Warehouse must belong to the selected branch.',
            ]);
        }

        $duplicateQ = PurchaseInvoice::query()
            ->where('branch_id', $data['branch_id'])
            ->where('invoice_number', $data['invoice_number']);

        if ($existing !== null) {
            $duplicateQ->where('id', '!=', $existing->id);
        }

        if ($duplicateQ->exists()) {
            throw ValidationException::withMessages([
                'invoice_number' => 'This invoice number is already used for this branch.',
            ]);
        }

        $lineKeys = [];
        foreach ($data['items'] as $idx => $row) {
            $vid = $row['product_variant_id'] ?? null;
            $bid = $row['product_batch_id'] ?? null;
            $key = $row['product_id'].'|'.($vid ?: '0').'|'.($bid ?: '0');
            if (isset($lineKeys[$key])) {
                throw ValidationException::withMessages([
                    "items.$idx.product_id" => 'Duplicate product / variant / batch. Combine quantities into one line.',
                ]);
            }
            $lineKeys[$key] = true;

            if ($vid) {
                $variant = ProductVarient::query()->find($vid);
                if (! $variant || (int) $variant->product_id !== (int) $row['product_id']) {
                    throw ValidationException::withMessages([
                        "items.$idx.product_variant_id" => 'Variant does not match product.',
                    ]);
                }
            }

            if ($bid) {
                $batch = ProductBatch::query()->find($bid);
                if (! $batch || (int) $batch->product_id !== (int) $row['product_id']) {
                    throw ValidationException::withMessages([
                        "items.$idx.product_batch_id" => 'Batch does not match product.',
                    ]);
                }
                if ($vid && $batch->product_variant_id && (int) $batch->product_variant_id !== (int) $vid) {
                    throw ValidationException::withMessages([
                        "items.$idx.product_batch_id" => 'Batch does not match selected variant.',
                    ]);
                }
            }

            $mode = $row['billing_mode'] ?? 'quantity';
            if ($mode === 'length_ft') {
                $pairsRaw = is_array($row['length_pairs'] ?? null) ? $row['length_pairs'] : [];
                $pairs = LengthBillingPairs::normalizeLengthPairsForStorage($pairsRaw);
                $totalFt = LengthBillingPairs::totalFeetFromLengthPairs($pairs);
                if ($totalFt <= 0) {
                    throw ValidationException::withMessages([
                        "items.$idx.length_pairs" => 'Length billing: total feet must be greater than zero.',
                    ]);
                }
                if ((float) ($row['unit_cost'] ?? 0) <= 0) {
                    throw ValidationException::withMessages([
                        "items.$idx.unit_cost" => 'Length billing: cost per ft must be greater than zero.',
                    ]);
                }
            } elseif ((float) ($row['quantity'] ?? 0) < 0.0001) {
                throw ValidationException::withMessages([
                    "items.$idx.quantity" => 'Quantity must be greater than zero.',
                ]);
            }
        }

        $shipping = (float) ($data['shipping_cost'] ?? 0);
        $invoiceDiscount = (float) ($data['discount_amount'] ?? 0);

        $linePayloads = [];
        $subtotalSum = 0.0;
        $taxSum = 0.0;

        foreach ($data['items'] as $row) {
            $billingMode = ($row['billing_mode'] ?? 'quantity') === 'length_ft' ? 'length_ft' : 'quantity';
            $lineDisc = (float) ($row['discount'] ?? 0);
            $taxRate = (float) ($row['tax_rate'] ?? 0);
            $normalizedPairs = null;

            if ($billingMode === 'length_ft') {
                $pairs = is_array($row['length_pairs'] ?? null) ? $row['length_pairs'] : [];
                $normalizedPairs = LengthBillingPairs::normalizeLengthPairsForStorage($pairs);
                $totalFt = LengthBillingPairs::totalFeetFromLengthPairs($normalizedPairs);
                $rate = round((float) ($row['unit_cost'] ?? 0), 2);
                $gross = round($totalFt * $rate, 2);
                $base = round(max(0.0, $gross - $lineDisc), 2);
                $qtyStored = $totalFt;
                $unitCostStored = $rate;
            } else {
                $qty = (float) $row['quantity'];
                $unitCost = (float) $row['unit_cost'];
                $base = round($qty * $unitCost - $lineDisc, 2);
                $qtyStored = $qty;
                $unitCostStored = $unitCost;
            }

            if ($base < 0) {
                throw ValidationException::withMessages([
                    'items' => 'Line amounts cannot be negative after discount.',
                ]);
            }
            $taxAmt = round($base * ($taxRate / 100), 2);
            $lineSubtotal = round($base + $taxAmt, 2);
            $subtotalSum += $base;
            $taxSum += $taxAmt;

            $linePayloads[] = [
                'product_id' => (int) $row['product_id'],
                'product_variant_id' => ! empty($row['product_variant_id']) ? (int) $row['product_variant_id'] : null,
                'product_batch_id' => ! empty($row['product_batch_id']) ? (int) $row['product_batch_id'] : null,
                'billing_mode' => $billingMode,
                'length_pairs' => $normalizedPairs,
                'quantity' => $qtyStored,
                'unit_cost' => $unitCostStored,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmt,
                'discount' => $lineDisc,
                'subtotal' => $lineSubtotal,
            ];
        }

        $subtotalSum = round($subtotalSum, 2);
        $taxSum = round($taxSum, 2);
        $total = round($subtotalSum + $taxSum + $shipping - $invoiceDiscount, 2);
        if ($total < 0) {
            throw ValidationException::withMessages([
                'discount_amount' => 'Discount is too large for this invoice.',
            ]);
        }

        return [
            'data' => $data,
            'linePayloads' => $linePayloads,
            'subtotalSum' => $subtotalSum,
            'taxSum' => $taxSum,
            'shipping' => $shipping,
            'invoiceDiscount' => $invoiceDiscount,
            'total' => $total,
        ];
    }
}
