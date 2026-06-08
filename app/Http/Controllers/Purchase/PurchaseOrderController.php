<?php

namespace App\Http\Controllers\Purchase;

use App\Http\Controllers\Controller;
use App\Mail\PurchaseOrderSentToSupplierMail;
use App\Models\Company\Branch;
use App\Models\Company\Warehouse;
use App\Models\Product\Product;
use App\Models\Product\ProductVarient;
use App\Models\PurchaseInvoice;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderNotificationLog;
use App\Models\Setting;
use App\Models\Supplier\Supplier;
use App\Support\BillingLineResolver;
use App\Support\PurchaseOrderDisplayRows;
use App\Support\PurchaseOrderPdf;
use App\Support\TwilioWhatsAppSender;
use Barryvdh\DomPDF\PDF;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class PurchaseOrderController extends Controller
{
    public function index(): Response
    {
        $orders = PurchaseOrder::query()
            ->with(['supplier:id,name'])
            ->latest('order_date')
            ->paginate(15);

        return Inertia::render('Purchase/Order/Index', [
            'orders' => $orders,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Purchase/Order/Create', $this->purchaseOrderFormProps());
    }

    public function store(Request $request): RedirectResponse
    {
        $payload = $this->validatedPurchaseOrderPayload($request, null);

        $orderId = null;

        DB::transaction(function () use ($payload, &$orderId): void {
            $order = PurchaseOrder::query()->create([
                'branch_id' => $payload['data']['branch_id'],
                'warehouse_id' => $payload['data']['warehouse_id'],
                'supplier_id' => $payload['data']['supplier_id'],
                'created_by' => Auth::id(),
                'order_number' => $payload['data']['order_number'],
                'order_date' => $payload['data']['order_date'],
                'expected_date' => $payload['data']['expected_date'] ?? null,
                'status' => 'pending',
                'subtotal' => $payload['subtotalSum'],
                'tax_amount' => $payload['taxSum'],
                'discount_amount' => $payload['orderDiscount'],
                'shipping_cost' => $payload['shipping'],
                'total' => $payload['total'],
                'paid_amount' => $payload['paidAmount'],
                'received_amount' => 0,
                'notes' => $payload['data']['notes'] ?? null,
            ]);

            $orderId = $order->id;

            foreach ($payload['linePayloads'] as $line) {
                $order->items()->create($line);
            }
        });

        return redirect()
            ->route('purchase-orders.show', $orderId)
            ->with('success', 'Purchase order created.');
    }

    public function edit(PurchaseOrder $purchase_order): Response
    {
        $this->assertPurchaseOrderEditable($purchase_order);

        $purchase_order->load('items');

        return Inertia::render('Purchase/Order/Edit', array_merge(
            $this->purchaseOrderFormProps(),
            ['order' => $purchase_order]
        ));
    }

    public function update(Request $request, PurchaseOrder $purchase_order): RedirectResponse
    {
        $this->assertPurchaseOrderEditable($purchase_order);

        $payload = $this->validatedPurchaseOrderPayload($request, $purchase_order);

        DB::transaction(function () use ($purchase_order, $payload): void {
            $purchase_order->update([
                'branch_id' => $payload['data']['branch_id'],
                'warehouse_id' => $payload['data']['warehouse_id'],
                'supplier_id' => $payload['data']['supplier_id'],
                'order_number' => $payload['data']['order_number'],
                'order_date' => $payload['data']['order_date'],
                'expected_date' => $payload['data']['expected_date'] ?? null,
                'subtotal' => $payload['subtotalSum'],
                'tax_amount' => $payload['taxSum'],
                'discount_amount' => $payload['orderDiscount'],
                'shipping_cost' => $payload['shipping'],
                'total' => $payload['total'],
                'paid_amount' => $payload['paidAmount'],
                'notes' => $payload['data']['notes'] ?? null,
            ]);

            $purchase_order->items()->each(static function ($item): void {
                $item->forceDelete();
            });

            foreach ($payload['linePayloads'] as $line) {
                $purchase_order->items()->create($line);
            }

            $purchase_order->refresh();
            $purchase_order->load('items');
            $this->refreshPurchaseOrderReceivedAggregate($purchase_order);
            $this->syncPurchaseOrderStatusFromQuantities($purchase_order);
            $purchase_order->save();
        });

        return redirect()
            ->route('purchase-orders.show', $purchase_order->id)
            ->with('success', 'Purchase order updated.');
    }

    public function destroy(PurchaseOrder $purchase_order): RedirectResponse
    {
        if ($purchase_order->status !== 'pending') {
            return redirect()
                ->route('purchase-orders.index')
                ->with('error', 'Only pending orders can be deleted.');
        }

        if ($purchase_order->paid_amount > 0) {
            return redirect()
                ->route('purchase-orders.index')
                ->with('error', 'Orders with payments recorded cannot be deleted.');
        }

        if (PurchaseInvoice::query()->where('purchase_order_id', $purchase_order->id)->exists()) {
            return redirect()
                ->route('purchase-orders.index')
                ->with('error', 'This order is linked to purchase invoices and cannot be deleted.');
        }

        DB::transaction(function () use ($purchase_order): void {
            $purchase_order->items()->each(static function ($item): void {
                $item->forceDelete();
            });
            $purchase_order->delete();
        });

        return redirect()
            ->route('purchase-orders.index')
            ->with('success', 'Purchase order deleted.');
    }

    public function pdf(PurchaseOrder $purchase_order): HttpResponse|RedirectResponse
    {
        try {
            /** @var PDF $generator */
            $generator = app()->make('dompdf.wrapper');

            return $generator
                ->loadView('purchase-orders.pdf', PurchaseOrderPdf::viewData($purchase_order))
                ->setPaper('a4', 'portrait')
                ->download(PurchaseOrderPdf::filename($purchase_order));
        } catch (\Throwable $e) {
            report($e);

            return redirect()
                ->route('purchase-orders.show', $purchase_order)
                ->with('error', 'PDF generation failed. Ensure dompdf is installed and PHP has the dom extension.');
        }
    }

    public function show(PurchaseOrder $purchase_order): Response
    {
        $purchase_order->load([
            'items.product:id,name',
            'items.productVarient:id,product_id,sku,name',
            'supplier:id,name',
            'branch:id,name',
            'warehouse:id,name',
            'invoices:id,purchase_order_id,invoice_number,status,total',
            'notificationLogs' => static fn ($q) => $q->limit(20),
        ]);

        $purchase_order->items->each(function ($item): void {
            $item->setAttribute('variant_label', PurchaseOrderDisplayRows::variantLabel($item));
        });

        return Inertia::render('Purchase/Order/Show', [
            'order' => $purchase_order,
        ]);
    }

    public function markSent(PurchaseOrder $purchase_order): RedirectResponse
    {
        if ($purchase_order->status !== 'pending') {
            return redirect()
                ->route('purchase-orders.show', $purchase_order->id)
                ->with('error', 'Only pending orders can be marked as sent to the supplier.');
        }

        $purchase_order->update(['status' => 'sent']);
        $purchase_order->refresh();
        $purchase_order->load(['supplier', 'items.product:id,name']);

        $emailResult = $this->attemptPurchaseOrderSupplierEmail($purchase_order);
        $waResult = $this->attemptPurchaseOrderSupplierWhatsApp($purchase_order);

        PurchaseOrderNotificationLog::query()->create([
            'purchase_order_id' => $purchase_order->id,
            'user_id' => Auth::id(),
            'email_status' => $emailResult['status'],
            'email_detail' => $emailResult['detail'],
            'whatsapp_status' => $waResult['status'],
            'whatsapp_detail' => $waResult['detail'],
        ]);

        $success = 'Order marked as sent to supplier. Notification attempt logged.';
        if ($emailResult['status'] === 'failed' || $waResult['status'] === 'failed') {
            $success .= ' One or more channels failed — see supplier notifications below.';
        }

        return redirect()
            ->route('purchase-orders.show', $purchase_order->id)
            ->with('success', $success);
    }

    public function markCancelled(PurchaseOrder $purchase_order): RedirectResponse
    {
        if ($purchase_order->status === 'cancelled') {
            return redirect()
                ->route('purchase-orders.show', $purchase_order->id)
                ->with('error', 'This order is already cancelled.');
        }

        if ($purchase_order->status === 'received') {
            return redirect()
                ->route('purchase-orders.show', $purchase_order->id)
                ->with('error', 'Received orders cannot be cancelled.');
        }

        $purchase_order->update(['status' => 'cancelled']);

        return redirect()
            ->route('purchase-orders.show', $purchase_order->id)
            ->with('success', 'Purchase order cancelled.');
    }

    /**
     * @return array<string, mixed>
     */
    private function purchaseOrderFormProps(): array
    {
        $suppliers = Supplier::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        $products = $this->purchaseOrderFormProducts();
        $variants = collect($products)
            ->flatMap(static fn (array $p): array => $p['variants'] ?? [])
            ->values()
            ->all();

        $branches = Branch::query()->where('status', 'active')->get(['id', 'name']);
        $warehouses = Warehouse::query()->where('status', 'active')->get(['id', 'name', 'branch_id']);

        return [
            'suppliers' => $suppliers,
            'branches' => $branches,
            'warehouses' => $warehouses,
            'products' => $products,
            'variants' => $variants,
            'invoice_prefix' => Setting::invoicePrefix(),
        ];
    }

    private function normalizePurchaseOrderRequest(Request $request): void
    {
        $items = collect($request->input('items', []))->map(static function (array $row): array {
            if (array_key_exists('product_variant_id', $row) && $row['product_variant_id'] === '') {
                $row['product_variant_id'] = null;
            }

            return $row;
        })->all();

        $request->merge([
            'items' => $items,
            'expected_date' => $request->input('expected_date') === '' ? null : $request->input('expected_date'),
        ]);
    }

    private function assertPurchaseOrderEditable(PurchaseOrder $purchase_order): void
    {
        if (in_array($purchase_order->status, ['received', 'cancelled'], true)) {
            abort(403, 'This purchase order can no longer be edited.');
        }
    }

    private function refreshPurchaseOrderReceivedAggregate(PurchaseOrder $purchase_order): void
    {
        $sum = 0.0;
        foreach ($purchase_order->items as $item) {
            $q = (float) $item->quantity;
            if ($q < 0.00001) {
                continue;
            }
            $r = min((float) $item->received_quantity, $q);
            $sum += round(($r / $q) * (float) $item->subtotal, 2);
        }
        $purchase_order->received_amount = round($sum, 2);
    }

    private function syncPurchaseOrderStatusFromQuantities(PurchaseOrder $purchase_order): void
    {
        $items = $purchase_order->items;
        if ($items->isEmpty()) {
            return;
        }

        $allFullyReceived = true;
        $anyReceived = false;
        foreach ($items as $item) {
            $q = (float) $item->quantity;
            $r = (float) $item->received_quantity;
            if ($r > 0.0001) {
                $anyReceived = true;
            }
            if ($q < 0.0001 || $r + 0.0001 < $q) {
                $allFullyReceived = false;
            }
        }

        if ($allFullyReceived) {
            $purchase_order->status = 'received';
        } elseif ($anyReceived) {
            $purchase_order->status = 'partial';
        } elseif (! $anyReceived && $purchase_order->status === 'partial') {
            $purchase_order->status = 'sent';
        }
    }

    /**
     * @return array{data: array<string, mixed>, linePayloads: list<array<string, mixed>>, subtotalSum: float, taxSum: float, shipping: float, orderDiscount: float, paidAmount: float, total: float}
     */
    private function validatedPurchaseOrderPayload(Request $request, ?PurchaseOrder $existing): array
    {
        $this->normalizePurchaseOrderRequest($request);

        $data = $request->validate([
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'order_number' => ['required', 'string', 'max:255'],
            'order_date' => ['required', 'date'],
            'expected_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'shipping_cost' => ['nullable', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'paid_amount' => ['nullable', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.product_variant_id' => ['nullable', 'integer', 'exists:product_varients,id'],
            'items.*.billing_mode' => ['nullable', Rule::in(BillingLineResolver::allowedModes())],
            'items.*.length_pairs' => ['nullable', 'array'],
            'items.*.length_pairs.*.length' => ['nullable', 'numeric', 'min:0'],
            'items.*.length_pairs.*.width' => ['nullable', 'numeric', 'min:0'],
            'items.*.length_pairs.*.height' => ['nullable', 'numeric', 'min:0'],
            'items.*.length_pairs.*.qty' => ['nullable', 'numeric', 'min:0'],
            'items.*.quantity' => ['required', 'numeric', 'min:0'],
            'items.*.received_quantity' => ['nullable', 'numeric', 'min:0'],
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

        $duplicateQ = PurchaseOrder::query()
            ->where('branch_id', $data['branch_id'])
            ->where('order_number', $data['order_number']);

        if ($existing !== null) {
            $duplicateQ->where('id', '!=', $existing->id);
        }

        if ($duplicateQ->exists()) {
            throw ValidationException::withMessages([
                'order_number' => 'This order number is already used for this branch.',
            ]);
        }

        $lineKeys = [];
        foreach ($data['items'] as $idx => $row) {
            $vid = $row['product_variant_id'] ?? null;
            $key = $row['product_id'].'|'.($vid ?: '0');
            if (isset($lineKeys[$key])) {
                throw ValidationException::withMessages([
                    "items.$idx.product_id" => 'Duplicate product / variant. Combine quantities into one line.',
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

            $err = BillingLineResolver::validatePurchaseItem($row);
            if ($err !== null) {
                throw ValidationException::withMessages([
                    "items.$idx.quantity" => $err,
                ]);
            }

            $recv = (float) ($row['received_quantity'] ?? 0);
            if ($recv > (float) $row['quantity'] + 0.00001) {
                throw ValidationException::withMessages([
                    "items.$idx.received_quantity" => 'Received quantity cannot exceed the quantity on the order.',
                ]);
            }

            if ($existing !== null && $existing->status === 'pending' && $recv > 0.0001) {
                throw ValidationException::withMessages([
                    "items.$idx.received_quantity" => 'Record receipts after the order is marked as sent to the supplier.',
                ]);
            }
        }

        $shipping = (float) ($data['shipping_cost'] ?? 0);
        $orderDiscount = (float) ($data['discount_amount'] ?? 0);
        $paidAmount = round((float) ($data['paid_amount'] ?? 0), 2);

        $linePayloads = [];
        $subtotalSum = 0.0;
        $taxSum = 0.0;

        foreach ($data['items'] as $row) {
            $resolved = BillingLineResolver::resolvePurchaseLine($row);
            $billingMode = $resolved['billing_mode'];
            $normalizedPairs = $resolved['length_pairs'];
            $qtyStored = $resolved['quantity'];
            $unitCostStored = $resolved['unit_cost'];
            $base = $resolved['base'];
            $lineDisc = (float) ($row['discount'] ?? 0);
            $taxRate = (float) ($row['tax_rate'] ?? 0);

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
                'product_variant_id' => PurchaseOrderDisplayRows::resolveLineVariantId($row),
                'billing_mode' => $billingMode,
                'length_pairs' => $normalizedPairs,
                'quantity' => $qtyStored,
                'received_quantity' => round((float) ($row['received_quantity'] ?? 0), 4),
                'unit_cost' => $unitCostStored,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmt,
                'discount' => $lineDisc,
                'subtotal' => $lineSubtotal,
            ];
        }

        $subtotalSum = round($subtotalSum, 2);
        $taxSum = round($taxSum, 2);
        $total = round($subtotalSum + $taxSum + $shipping - $orderDiscount, 2);
        if ($total < 0) {
            throw ValidationException::withMessages([
                'discount_amount' => 'Discount is too large for this order.',
            ]);
        }

        return [
            'data' => $data,
            'linePayloads' => $linePayloads,
            'subtotalSum' => $subtotalSum,
            'taxSum' => $taxSum,
            'shipping' => $shipping,
            'orderDiscount' => $orderDiscount,
            'paidAmount' => $paidAmount,
            'total' => $total,
        ];
    }

    /**
     * @return array{status: string, detail: string|null}
     */
    private function attemptPurchaseOrderSupplierEmail(PurchaseOrder $purchase_order): array
    {
        $email = trim((string) ($purchase_order->supplier?->email ?? ''));
        if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['status' => 'skipped', 'detail' => 'Supplier email missing or invalid'];
        }

        try {
            Mail::to($email)->send(new PurchaseOrderSentToSupplierMail($purchase_order));

            return ['status' => 'sent', 'detail' => null];
        } catch (\Throwable $e) {
            report($e);

            return ['status' => 'failed', 'detail' => $e->getMessage()];
        }
    }

    /**
     * @return array{status: string, detail: string|null}
     */
    private function attemptPurchaseOrderSupplierWhatsApp(PurchaseOrder $purchase_order): array
    {
        $sender = app(TwilioWhatsAppSender::class);
        $phone = TwilioWhatsAppSender::normalizePhone($purchase_order->supplier?->phone);

        if ($phone === null) {
            return ['status' => 'skipped', 'detail' => 'Supplier phone missing or invalid'];
        }

        if (! $sender->configured()) {
            return ['status' => 'skipped', 'detail' => 'Twilio WhatsApp not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM)'];
        }

        $body = $this->purchaseOrderWhatsAppBody($purchase_order);
        $result = $sender->sendWhatsApp($phone, $body);

        return [
            'status' => $result['ok'] ? 'sent' : 'failed',
            'detail' => $result['detail'],
        ];
    }

    private function purchaseOrderWhatsAppBody(PurchaseOrder $purchase_order): string
    {
        $company = (string) config('app.name');
        $lines = [];
        foreach ($purchase_order->items as $item) {
            $name = $item->product?->name ?? ('#'.$item->product_id);
            $lines[] = $name.' × '.$item->quantity;
        }

        $head = [
            'Purchase order '.$purchase_order->order_number.' — '.$company,
            'Total: '.$purchase_order->total,
            'Expected: '.($purchase_order->expected_date?->format('d-m-Y') ?? '—'),
            '',
        ];

        return implode("\n", array_merge($head, array_slice($lines, 0, 15)));
    }

    /**
     * Products with variants for PO create/edit (search by name or variant SKU).
     *
     * @return list<array{id: int, name: string, variants: list<array<string, mixed>>}>
     */
    private function purchaseOrderFormProducts(): array
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
                                'product_id' => $v->product_id,
                                'name' => $v->name,
                                'sku' => $v->sku,
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
            })
            ->values()
            ->all();
    }

    public function destroyNotificationLog(PurchaseOrderNotificationLog $purchaseOrderNotificationLog): RedirectResponse
    {
        $purchaseOrderNotificationLog->delete();

        return redirect()->back()->with('success', 'Notification log deleted.');
    }
}
