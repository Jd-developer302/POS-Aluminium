<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Company\Branch;
use App\Models\Customer\CustomerDueItem;
use App\Models\Product\Product;
use App\Models\Product\ProductVarient;
use App\Models\Supplier\Customer;
use App\Services\Customer\CustomerReceivableService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class CustomerReceivableController extends Controller
{
    public function __construct(
        private readonly CustomerReceivableService $receivables,
    ) {}

    public function index(Request $request): Response
    {
        $branchId = $request->integer('branch_id') ?: null;
        $customerId = $request->integer('customer_id') ?: null;
        $status = $request->query('status');

        $query = CustomerDueItem::query()
            ->with([
                'branch:id,name',
                'customer:id,name,code',
                'product:id,name',
                'productVariant:id,sku,name',
            ])
            ->latest('transaction_date')
            ->latest('id');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }
        if ($customerId) {
            $query->where('customer_id', $customerId);
        }
        if (is_string($status) && $status !== '' && in_array($status, ['unpaid', 'partial', 'paid', 'written_off', 'cancelled'], true)) {
            $query->where('status', $status);
        }

        $dueItems = $query->paginate(20)->withQueryString();

        $summary = $this->receivables->summaryForFilters($branchId, $customerId);

        $branches = Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']);
        $customers = Customer::query()->where('status', 'active')->orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Customer/Receivables/Index', [
            'dueItems' => $dueItems,
            'summary' => $summary,
            'branches' => $branches,
            'customers' => $customers,
            'filters' => [
                'branch_id' => $branchId,
                'customer_id' => $customerId,
                'status' => is_string($status) ? $status : '',
            ],
        ]);
    }

    public function createDueItem(): Response
    {
        return Inertia::render('Customer/Receivables/DueItemCreate', $this->sharedFormProps());
    }

    public function storeDueItem(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'branch_id' => ['required', 'integer', Rule::exists('branches', 'id')],
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')],
            'source_type' => ['required', Rule::in(['old_balance', 'sale', 'manual'])],
            'sale_id' => ['nullable', 'integer', Rule::exists('sales', 'id')],
            'product_id' => ['nullable', 'integer', Rule::exists('products', 'id')],
            'product_variant_id' => ['nullable', 'integer', Rule::exists('product_varients', 'id')],
            'product_name' => ['nullable', 'string', 'max:255'],
            'variant_name' => ['nullable', 'string', 'max:255'],
            'reference_no' => ['nullable', 'string', 'max:100'],
            'transaction_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:transaction_date'],
            'original_amount' => ['required', 'numeric', 'min:0.01'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'supporting_image' => ['nullable', 'image', 'max:10240'],
            'supporting_pdf' => ['nullable', 'file', 'mimes:pdf', 'max:15360'],
        ]);

        if (($validated['source_type'] ?? '') === 'sale' && empty($validated['sale_id'])) {
            return redirect()->back()->withInput()->with('error', 'Sale is required when source type is sale.');
        }

        foreach (['sale_id', 'product_id', 'product_variant_id'] as $k) {
            if (array_key_exists($k, $validated) && ($validated[$k] === '' || $validated[$k] === null)) {
                $validated[$k] = null;
            }
        }

        try {
            $this->receivables->storeDueItem(
                $validated,
                $request->file('supporting_image'),
                $request->file('supporting_pdf'),
            );
        } catch (RuntimeException $e) {
            return redirect()->back()->withInput()->with('error', $e->getMessage());
        }

        return redirect()
            ->route('customer-receivables.index', [
                'branch_id' => $validated['branch_id'],
                'customer_id' => $validated['customer_id'],
            ])
            ->with('success', 'Due line added.');
    }

    public function createReceipt(): Response
    {
        return Inertia::render('Customer/Receivables/ReceiptCreate', $this->sharedFormProps());
    }

    public function storeReceipt(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'branch_id' => ['required', 'integer', Rule::exists('branches', 'id')],
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')],
            'receipt_date' => ['required', 'date'],
            'receipt_type' => ['required', Rule::in(['recovery', 'sale_payment', 'advance'])],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'string', 'max:50'],
            'payment_reference' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'auto_allocate' => ['sometimes', 'boolean'],
        ]);

        $auto = $request->boolean('auto_allocate', true);

        try {
            $this->receivables->storeReceiptWithOptionalAllocation($validated, $auto);
        } catch (RuntimeException $e) {
            return redirect()->back()->withInput()->with('error', $e->getMessage());
        }

        return redirect()
            ->route('customer-receivables.index', [
                'branch_id' => $validated['branch_id'],
                'customer_id' => $validated['customer_id'],
            ])
            ->with('success', 'Receipt recorded.');
    }

    public function createAdjustment(Request $request): Response
    {
        $props = $this->sharedFormProps();

        $props['prefill'] = [
            'branch_id' => $request->filled('branch_id') ? $request->integer('branch_id') : null,
            'customer_id' => $request->filled('customer_id') ? $request->integer('customer_id') : null,
        ];

        $props['openDueItems'] = [];
        if ($request->filled('branch_id') && $request->filled('customer_id')) {
            $props['openDueItems'] = CustomerDueItem::query()
                ->where('branch_id', $request->integer('branch_id'))
                ->where('customer_id', $request->integer('customer_id'))
                ->whereNotIn('status', ['cancelled', 'written_off'])
                ->with(['customer:id,name,code', 'branch:id,name'])
                ->orderBy('transaction_date')
                ->orderBy('id')
                ->limit(500)
                ->get([
                    'id',
                    'branch_id',
                    'customer_id',
                    'reference_no',
                    'transaction_date',
                    'original_amount',
                    'paid_amount',
                    'adjusted_amount',
                    'balance_amount',
                    'status',
                    'product_name',
                    'variant_name',
                ]);
        }

        return Inertia::render('Customer/Receivables/AdjustmentCreate', $props);
    }

    public function storeAdjustment(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'branch_id' => ['required', 'integer', Rule::exists('branches', 'id')],
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')],
            'customer_due_item_id' => [
                'required',
                'integer',
                Rule::exists('customer_due_items', 'id')
                    ->where('customer_id', (int) $request->input('customer_id'))
                    ->where('branch_id', (int) $request->input('branch_id')),
            ],
            'adjustment_date' => ['required', 'date'],
            'adjustment_type' => ['required', Rule::in(['discount', 'write_off', 'correction'])],
            'amount' => ['required', 'numeric'],
            'reason' => ['nullable', 'string', 'max:5000'],
        ]);

        if (in_array($validated['adjustment_type'], ['discount', 'write_off'], true) && (float) $validated['amount'] <= 0) {
            return redirect()->back()->withInput()->with('error', 'Amount must be greater than zero for discount or write-off.');
        }

        try {
            $this->receivables->storeAdjustment($validated);
        } catch (RuntimeException $e) {
            return redirect()->back()->withInput()->with('error', $e->getMessage());
        }

        return redirect()
            ->route('customer-receivables.index', [
                'branch_id' => $validated['branch_id'],
                'customer_id' => $validated['customer_id'],
            ])
            ->with('success', 'Adjustment saved.');
    }

    /**
     * @return array<string, mixed>
     */
    private function sharedFormProps(): array
    {
        $branches = Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']);
        $customers = Customer::query()->where('status', 'active')->orderBy('name')->get(['id', 'name', 'code']);

        $products = Product::query()
            ->where('status', 'active')
            ->with(['varients' => fn ($q) => $q->where('status', 'active')->orderBy('sku')])
            ->orderBy('name')
            ->limit(250)
            ->get(['id', 'name', 'type'])
            ->map(static function (Product $p): array {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'type' => $p->type,
                    'variants' => $p->varients
                        ->map(static fn (ProductVarient $v): array => [
                            'id' => $v->id,
                            'sku' => $v->sku,
                            'name' => $v->name,
                        ])
                        ->values()
                        ->all(),
                ];
            });

        return [
            'branches' => $branches,
            'customers' => $customers,
            'products' => $products,
        ];
    }
}
