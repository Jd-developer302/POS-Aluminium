<?php

namespace App\Services\Report;

use App\Models\Company\Branch;
use App\Models\Company\Warehouse;
use App\Models\Customer\CustomerDueItem;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\InventoryMovement;
use App\Models\Product\Product;
use App\Models\Product\ProductVarient;
use App\Models\PurchaseInvoice;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderNotificationLog;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use App\Models\Setting;
use App\Models\Stock;
use App\Models\StockAdjustment;
use App\Models\StockTransfer;
use App\Models\Supplier\Customer;
use App\Models\Supplier\Supplier;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator as ConcretePaginator;
use Illuminate\Support\Facades\DB;

final class ReportTableBuilder
{
    public const TYPES = [
        'customer-aging',
        'customer-due-register',
        'discount-analysis',
        'expense-vs-sales',
        'expenses',
        'inventory-movements',
        'profit-margin',
        'product-sales-summary',
        'purchase-invoices',
        'purchase-order-notifications',
        'purchase-orders',
        'quotation-lines',
        'quotations',
        'returns-analysis',
        'sale-returns',
        'sales',
        'stock-adjustments',
        'stock-transfers',
        'stocks',
        'stock-valuation',
        'supplier-aging',
        'tax-summary',
    ];

    /**
     * @return array{columns: list<array{key: string, label: string}>, paginator: LengthAwarePaginator<int, array<string, string|null>>, filterOptions: array<string, mixed>, title: string}
     */
    public function paginated(string $type, Request $request): array
    {
        $perPage = 20;
        $payload = $this->basePayload($type, $request, true, $perPage);

        return [
            'columns' => $payload['columns'],
            'paginator' => $payload['paginator'],
            'filterOptions' => $payload['filterOptions'],
            'title' => $payload['title'],
        ];
    }

    /**
     * @return array{columns: list<array{key: string, label: string}>, rows: list<array<string, string|null>>, title: string}
     */
    public function exportRows(string $type, Request $request, int $limit = 5000): array
    {
        $payload = $this->basePayload($type, $request, false, $limit);

        return [
            'columns' => $payload['columns'],
            'rows' => $payload['rows'],
            'title' => $payload['title'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function basePayload(string $type, Request $request, bool $paginate, int $perPageOrLimit): array
    {
        return match ($type) {
            'customer-aging' => $this->customerAging($request, $paginate, $perPageOrLimit),
            'customer-due-register' => $this->customerDueRegister($request, $paginate, $perPageOrLimit),
            'discount-analysis' => $this->discountAnalysis($request, $paginate, $perPageOrLimit),
            'expense-vs-sales' => $this->expenseVsSales($request, $paginate, $perPageOrLimit),
            'expenses' => $this->expenses($request, $paginate, $perPageOrLimit),
            'inventory-movements' => $this->inventoryMovements($request, $paginate, $perPageOrLimit),
            'profit-margin' => $this->profitMargin($request, $paginate, $perPageOrLimit),
            'product-sales-summary' => $this->productSalesSummary($request, $paginate, $perPageOrLimit),
            'purchase-invoices' => $this->purchaseInvoices($request, $paginate, $perPageOrLimit),
            'purchase-order-notifications' => $this->purchaseOrderNotifications($request, $paginate, $perPageOrLimit),
            'purchase-orders' => $this->purchaseOrders($request, $paginate, $perPageOrLimit),
            'quotation-lines' => $this->quotationLines($request, $paginate, $perPageOrLimit),
            'quotations' => $this->quotationsReport($request, $paginate, $perPageOrLimit),
            'returns-analysis' => $this->returnsAnalysis($request, $paginate, $perPageOrLimit),
            'sale-returns' => $this->saleReturns($request, $paginate, $perPageOrLimit),
            'sales' => $this->sales($request, $paginate, $perPageOrLimit),
            'stock-adjustments' => $this->stockAdjustments($request, $paginate, $perPageOrLimit),
            'stock-transfers' => $this->stockTransfers($request, $paginate, $perPageOrLimit),
            'stocks' => $this->stocks($request, $paginate, $perPageOrLimit),
            'stock-valuation' => $this->stockValuation($request, $paginate, $perPageOrLimit),
            'supplier-aging' => $this->supplierAging($request, $paginate, $perPageOrLimit),
            'tax-summary' => $this->taxSummary($request, $paginate, $perPageOrLimit),
            default => throw new \InvalidArgumentException('Invalid report type.'),
        };
    }

    /**
     * @return array{columns: list<array{key: string, label: string}>, paginator?: LengthAwarePaginator<int, array<string, string|null>>, rows?: list<array<string, string|null>>, filterOptions: array<string, mixed>, title: string}
     */
    private function expenses(Request $request, bool $paginate, int $n): array
    {
        $columns = [
            ['key' => 'id', 'label' => 'ID'],
            ['key' => 'expense_date', 'label' => 'Date'],
            ['key' => 'branch', 'label' => 'Branch'],
            ['key' => 'category', 'label' => 'Category'],
            ['key' => 'amount', 'label' => 'Amount'],
            ['key' => 'reference_number', 'label' => 'Reference'],
            ['key' => 'notes', 'label' => 'Notes'],
        ];

        $q = Expense::query()
            ->with(['branch:id,name', 'category:id,name'])
            ->when($request->query('date_from'), fn (Builder $b, $v) => $b->whereDate('expense_date', '>=', $v))
            ->when($request->query('date_to'), fn (Builder $b, $v) => $b->whereDate('expense_date', '<=', $v))
            ->when($request->query('branch_id'), fn (Builder $b, $v) => $b->where('branch_id', (int) $v))
            ->when($request->query('category_id'), fn (Builder $b, $v) => $b->where('category_id', (int) $v))
            ->when($request->query('q'), function (Builder $b, $v) {
                $t = '%'.trim((string) $v).'%';
                $b->where(function (Builder $sub) use ($t) {
                    $sub->where('reference_number', 'like', $t)->orWhere('notes', 'like', $t);
                });
            })
            ->latest('expense_date')
            ->latest('id');

        $mapRow = function (Expense $e): array {
            return [
                'id' => (string) $e->id,
                'expense_date' => $e->expense_date?->format('Y-m-d') ?? '',
                'branch' => $e->branch?->name ?? '—',
                'category' => $e->category?->name ?? '—',
                'amount' => (string) $e->amount,
                'reference_number' => $e->reference_number ?? '',
                'notes' => $e->notes ? substr((string) $e->notes, 0, 200) : '',
            ];
        };

        return $this->mapPaginator(
            'Expenses report',
            $columns,
            $q,
            $paginate,
            $n,
            $mapRow,
            $this->expenseFilterOptions()
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function expenseFilterOptions(): array
    {
        return [
            'branches' => Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
            'categories' => ExpenseCategory::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
        ];
    }

    /**
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $q
     * @param  callable(TModel): array<string, string|null>  $mapRow
     * @return array{columns: list<array{key: string, label: string}>, paginator?: LengthAwarePaginator<int, array<string, string|null>>, rows?: list<array<string, string|null>>, filterOptions: array<string, mixed>, title: string}
     */
    private function mapPaginator(string $title, array $columns, Builder $q, bool $paginate, int $n, callable $mapRow, array $filterOptions = []): array
    {
        if ($paginate) {
            $paginator = $q->paginate($n)->through($mapRow);

            return [
                'title' => $title,
                'columns' => $columns,
                'paginator' => $paginator,
                'filterOptions' => $filterOptions,
            ];
        }

        $rows = $q->limit($n)->get()->map($mapRow)->values()->all();

        return [
            'title' => $title,
            'columns' => $columns,
            'rows' => $rows,
            'filterOptions' => $filterOptions,
        ];
    }

    private function purchaseInvoices(Request $request, bool $paginate, int $n): array
    {
        $columns = [
            ['key' => 'id', 'label' => 'ID'],
            ['key' => 'invoice_number', 'label' => 'Invoice #'],
            ['key' => 'invoice_date', 'label' => 'Date'],
            ['key' => 'branch', 'label' => 'Branch'],
            ['key' => 'warehouse', 'label' => 'Warehouse'],
            ['key' => 'supplier', 'label' => 'Supplier'],
            ['key' => 'status', 'label' => 'Status'],
            ['key' => 'total', 'label' => 'Total'],
            ['key' => 'paid_amount', 'label' => 'Paid'],
            ['key' => 'due_amount', 'label' => 'Due'],
        ];

        $selectedIds = $this->normalizeExportIds($request);

        $q = PurchaseInvoice::query()
            ->with(['branch:id,name', 'warehouse:id,name', 'supplier:id,name'])
            ->when($selectedIds !== [], fn (Builder $b) => $b->whereIn('id', $selectedIds))
            ->when($request->query('date_from'), fn (Builder $b, $v) => $b->whereDate('invoice_date', '>=', $v))
            ->when($request->query('date_to'), fn (Builder $b, $v) => $b->whereDate('invoice_date', '<=', $v))
            ->when($request->query('branch_id'), fn (Builder $b, $v) => $b->where('branch_id', (int) $v))
            ->when($request->query('warehouse_id'), fn (Builder $b, $v) => $b->where('warehouse_id', (int) $v))
            ->when($request->query('supplier_id'), fn (Builder $b, $v) => $b->where('supplier_id', (int) $v))
            ->when($request->query('status'), fn (Builder $b, $v) => $b->where('status', $v))
            ->when($request->query('q'), fn (Builder $b, $v) => $b->where('invoice_number', 'like', '%'.trim((string) $v).'%'))
            ->latest('invoice_date')
            ->latest('id');

        $mapRow = function (PurchaseInvoice $p): array {
            return [
                'id' => (string) $p->id,
                'invoice_number' => $p->invoice_number,
                'invoice_date' => $p->invoice_date?->format('Y-m-d') ?? '',
                'branch' => $p->branch?->name ?? '—',
                'warehouse' => $p->warehouse?->name ?? '—',
                'supplier' => $p->supplier?->name ?? '—',
                'status' => (string) $p->status,
                'total' => (string) $p->total,
                'paid_amount' => (string) $p->paid_amount,
                'due_amount' => (string) $p->due_amount,
            ];
        };

        return $this->mapPaginator(
            'Purchase invoices report',
            $columns,
            $q,
            $paginate,
            $n,
            $mapRow,
            [
                'branches' => Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
                'warehouses' => Warehouse::query()->where('status', 'active')->orderBy('name')->get(['id', 'name', 'branch_id']),
                'suppliers' => $this->reportFilterSuppliers(),
            ]
        );
    }

    private function inventoryMovements(Request $request, bool $paginate, int $n): array
    {
        $columns = [
            ['key' => 'id', 'label' => 'ID'],
            ['key' => 'created_at', 'label' => 'When'],
            ['key' => 'direction', 'label' => 'Direction'],
            ['key' => 'source_type', 'label' => 'Source'],
            ['key' => 'reference', 'label' => 'Reference'],
            ['key' => 'product', 'label' => 'Product'],
            ['key' => 'branch', 'label' => 'Branch'],
            ['key' => 'warehouse', 'label' => 'Warehouse'],
            ['key' => 'quantity', 'label' => 'Qty'],
            ['key' => 'before_qty', 'label' => 'Before'],
            ['key' => 'after_qty', 'label' => 'After'],
            ['key' => 'user', 'label' => 'User'],
        ];

        $selectedIds = $this->normalizeExportIds($request);

        $q = InventoryMovement::query()
            ->with([
                'product:id,name',
                'branch:id,name',
                'warehouse:id,name,branch_id',
                'createdBy:id,name',
                'createdBy.employee:id,user_id,name',
            ])
            ->when($selectedIds !== [], fn (Builder $b) => $b->whereIn('id', $selectedIds))
            ->when($request->query('q'), function (Builder $b, $v) {
                $t = '%'.trim((string) $v).'%';
                $b->where(function (Builder $sub) use ($t) {
                    $sub->where('reference', 'like', $t)->orWhere('source_type', 'like', $t);
                });
            })
            ->when($request->query('direction'), fn (Builder $b, $v) => $b->where('direction', $v))
            ->when($request->query('source_type'), fn (Builder $b, $v) => $b->where('source_type', $v))
            ->when($request->query('branch_id'), fn (Builder $b, $v) => $b->where('branch_id', (int) $v))
            ->when($request->query('warehouse_id'), fn (Builder $b, $v) => $b->where('warehouse_id', (int) $v))
            ->when($request->query('product_id'), fn (Builder $b, $v) => $b->where('product_id', (int) $v))
            ->when($request->query('date_from'), fn (Builder $b, $v) => $b->whereDate('created_at', '>=', $v))
            ->when($request->query('date_to'), fn (Builder $b, $v) => $b->whereDate('created_at', '<=', $v))
            ->latest('id');

        $mapRow = function (InventoryMovement $m): array {
            return [
                'id' => (string) $m->id,
                'created_at' => $m->created_at?->format('Y-m-d H:i') ?? '',
                'direction' => (string) $m->direction,
                'source_type' => (string) $m->source_type,
                'reference' => $m->reference ?? '',
                'product' => $m->product?->name ?? '—',
                'branch' => $m->branch?->name ?? '—',
                'warehouse' => $m->warehouse?->name ?? '—',
                'quantity' => $this->formatReportQty($m->quantity),
                'before_qty' => $this->formatReportQty($m->before_qty),
                'after_qty' => $this->formatReportQty($m->after_qty),
                'user' => $m->createdBy ? $m->createdBy->displayName() : '—',
            ];
        };

        return $this->mapPaginator(
            'Inventory movements report',
            $columns,
            $q,
            $paginate,
            $n,
            $mapRow,
            [
                'branches' => Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
                'warehouses' => Warehouse::query()->where('status', 'active')->orderBy('name')->get(['id', 'name', 'branch_id']),
                'products' => $this->reportFilterProducts(),
            ]
        );
    }

    private function stockTransfers(Request $request, bool $paginate, int $n): array
    {
        $columns = [
            ['key' => 'id', 'label' => 'ID'],
            ['key' => 'transfer_date', 'label' => 'Date'],
            ['key' => 'reference_number', 'label' => 'Reference'],
            ['key' => 'from_branch', 'label' => 'From branch'],
            ['key' => 'to_branch', 'label' => 'To branch'],
            ['key' => 'from_warehouse', 'label' => 'From WH'],
            ['key' => 'to_warehouse', 'label' => 'To WH'],
            ['key' => 'status', 'label' => 'Status'],
            ['key' => 'total_quantity', 'label' => 'Total qty'],
        ];

        $q = StockTransfer::query()
            ->when($request->query('date_from'), fn (Builder $b, $v) => $b->whereDate('transfer_date', '>=', $v))
            ->when($request->query('date_to'), fn (Builder $b, $v) => $b->whereDate('transfer_date', '<=', $v))
            ->when($request->query('from_branch_id'), fn (Builder $b, $v) => $b->where('from_branch_id', (int) $v))
            ->when($request->query('to_branch_id'), fn (Builder $b, $v) => $b->where('to_branch_id', (int) $v))
            ->when($request->query('status'), fn (Builder $b, $v) => $b->where('status', $v))
            ->when($request->query('q'), fn (Builder $b, $v) => $b->where('reference_number', 'like', '%'.trim((string) $v).'%'))
            ->latest('transfer_date')
            ->latest('id');

        $branchNames = Branch::query()->pluck('name', 'id');
        $whNames = Warehouse::query()->pluck('name', 'id');

        $mapRow = function (StockTransfer $t) use ($branchNames, $whNames): array {
            return [
                'id' => (string) $t->id,
                'transfer_date' => $t->transfer_date?->format('Y-m-d') ?? '',
                'reference_number' => $t->reference_number,
                'from_branch' => (string) ($branchNames[$t->from_branch_id] ?? '—'),
                'to_branch' => (string) ($branchNames[$t->to_branch_id] ?? '—'),
                'from_warehouse' => (string) ($whNames[$t->from_warehouse_id] ?? '—'),
                'to_warehouse' => (string) ($whNames[$t->to_warehouse_id] ?? '—'),
                'status' => (string) $t->status,
                'total_quantity' => (string) $t->total_quantity,
            ];
        };

        return $this->mapPaginator(
            'Stock transfers report',
            $columns,
            $q,
            $paginate,
            $n,
            $mapRow,
            ['branches' => Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name'])]
        );
    }

    /**
     * @param  array<int, mixed>|null  $pairs
     */
    private function stockLengthsLxQSummary(?array $pairs): string
    {
        if (! is_array($pairs) || $pairs === []) {
            return '—';
        }
        $parts = [];
        foreach ($pairs as $row) {
            if (! is_array($row)) {
                continue;
            }
            $l = (float) ($row['length'] ?? $row['l'] ?? 0);
            $q = (float) ($row['qty'] ?? $row['q'] ?? 0);
            if ($l <= 0 && $q <= 0) {
                continue;
            }
            $parts[] = $this->formatReportQty($l).'×'.$this->formatReportQty($q);
        }

        return $parts !== [] ? implode(' + ', $parts) : '—';
    }

    private function stocks(Request $request, bool $paginate, int $n): array
    {
        $globalLow = Setting::lowStockThreshold();

        $columns = [
            ['key' => 'id', 'label' => 'ID'],
            ['key' => 'product', 'label' => 'Product'],
            ['key' => 'variant', 'label' => 'Variant'],
            ['key' => 'warehouse', 'label' => 'Warehouse'],
            ['key' => 'branch', 'label' => 'Branch'],
            ['key' => 'lengths_lxq', 'label' => 'Lengths (L×Q)'],
            ['key' => 'actual_ft', 'label' => 'Actual ft (on hand)'],
            ['key' => 'qty_units', 'label' => 'Qty (units)'],
            ['key' => 'reserved', 'label' => 'Reserved'],
            ['key' => 'available', 'label' => 'Available'],
            ['key' => 'status', 'label' => 'Status'],
            ['key' => 'low_stock', 'label' => 'Low?'],
        ];

        $q = Stock::query()
            ->with([
                'product:id,name,quantity_alert',
                'productVarient:id,product_id,name,sku',
                'warehouse:id,name,branch_id',
                'warehouse.branch:id,name',
            ])
            ->when($request->query('q'), function (Builder $b, $v) {
                $b->whereHas('product', fn ($qq) => $qq->where('name', 'like', '%'.$v.'%'))
                    ->orWhereHas('productVarient', fn ($qq) => $qq->where('sku', 'like', '%'.$v.'%'));
            })
            ->when($request->query('status'), fn (Builder $b, $v) => $b->where('status', $v))
            ->when($request->query('warehouse_id'), fn (Builder $b, $v) => $b->where('warehouse_id', (int) $v))
            ->when($request->query('product_id'), fn (Builder $b, $v) => $b->where('product_id', (int) $v))
            ->when($request->query('branch_id'), function (Builder $b, $v) {
                $b->whereHas('warehouse', fn ($qq) => $qq->where('branch_id', (int) $v));
            })
            ->latest('id');

        $mapRow = function (Stock $s) use ($globalLow): array {
            $threshold = $s->product?->quantity_alert !== null
                ? (int) $s->product->quantity_alert
                : $globalLow;
            $available = (float) $s->quantity - (float) $s->reserved_quantity;
            $low = $s->status === 'active' && $available <= (float) $threshold;

            $billing = (string) ($s->billing_mode ?? 'quantity');
            $rawPairs = is_array($s->length_pairs) ? $s->length_pairs : [];

            $lengthsLxq = '—';
            $actualFt = '—';
            $qtyUnits = '—';

            if ($billing === 'length_ft') {
                $lengthsLxq = $this->stockLengthsLxQSummary($rawPairs);
                if ($lengthsLxq === '—') {
                    $qtyFt = (float) $s->quantity;
                    if ($qtyFt > 0) {
                        $lengthsLxq = $this->formatReportQty($qtyFt).'×1';
                    }
                }
                $actualFt = $this->formatReportQty($s->quantity);
                $qtyUnits = '—';
            } else {
                $qtyUnits = $this->formatReportQty($s->quantity);
            }

            $variant = $s->productVarient;
            $variantLabel = $variant
                ? (trim((string) ($variant->sku ?? '')) !== '' && trim((string) ($variant->name ?? '')) !== ''
                    ? (string) $variant->sku.' — '.(string) $variant->name
                    : ((string) ($variant->sku ?? '') ?: (string) ($variant->name ?? '') ?: '—'))
                : '—';

            return [
                'id' => (string) $s->id,
                'product' => $s->product?->name ?? '—',
                'variant' => $variantLabel,
                'warehouse' => $s->warehouse?->name ?? '—',
                'branch' => $s->warehouse?->branch?->name ?? '—',
                'lengths_lxq' => $lengthsLxq,
                'actual_ft' => $actualFt,
                'qty_units' => $qtyUnits,
                'reserved' => $this->formatReportQty($s->reserved_quantity),
                'available' => $this->formatReportQty($available),
                'status' => (string) $s->status,
                'low_stock' => $low ? 'Yes' : 'No',
            ];
        };

        return $this->mapPaginator(
            'Stocks report',
            $columns,
            $q,
            $paginate,
            $n,
            $mapRow,
            [
                'branches' => Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
                'warehouses' => Warehouse::query()->where('status', 'active')->orderBy('name')->get(['id', 'name', 'branch_id']),
                'products' => Product::query()->where('status', 'active')->orderBy('name')->limit(300)->get(['id', 'name']),
            ]
        );
    }

    private function stockAdjustments(Request $request, bool $paginate, int $n): array
    {
        $columns = [
            ['key' => 'id', 'label' => 'ID'],
            ['key' => 'adjustment_date', 'label' => 'Date'],
            ['key' => 'reference_number', 'label' => 'Reference'],
            ['key' => 'type', 'label' => 'Type'],
            ['key' => 'status', 'label' => 'Status'],
            ['key' => 'branch', 'label' => 'Branch'],
            ['key' => 'warehouse', 'label' => 'Warehouse'],
            ['key' => 'total_quantity', 'label' => 'Total qty'],
            ['key' => 'reason', 'label' => 'Reason'],
        ];

        $q = StockAdjustment::query()
            ->when($request->query('date_from'), fn (Builder $b, $v) => $b->whereDate('adjustment_date', '>=', $v))
            ->when($request->query('date_to'), fn (Builder $b, $v) => $b->whereDate('adjustment_date', '<=', $v))
            ->when($request->query('branch_id'), fn (Builder $b, $v) => $b->where('branch_id', (int) $v))
            ->when($request->query('warehouse_id'), fn (Builder $b, $v) => $b->where('warehouse_id', (int) $v))
            ->when($request->query('status'), fn (Builder $b, $v) => $b->where('status', $v))
            ->when($request->query('type'), fn (Builder $b, $v) => $b->where('type', $v))
            ->when($request->query('q'), fn (Builder $b, $v) => $b->where('reference_number', 'like', '%'.trim((string) $v).'%'))
            ->latest('adjustment_date')
            ->latest('id');

        $wh = Warehouse::query()->get()->keyBy('id');
        $branchNames = Branch::query()->pluck('name', 'id');

        $mapRow = function (StockAdjustment $a) use ($wh, $branchNames): array {
            $w = $wh->get($a->warehouse_id);

            return [
                'id' => (string) $a->id,
                'adjustment_date' => $a->adjustment_date?->format('Y-m-d') ?? '',
                'reference_number' => $a->reference_number ?? '',
                'type' => (string) $a->type,
                'status' => (string) $a->status,
                'branch' => (string) ($branchNames[$a->branch_id] ?? '—'),
                'warehouse' => $w?->name ?? '—',
                'total_quantity' => (string) $a->total_quantity,
                'reason' => $a->reason ? substr((string) $a->reason, 0, 120) : '',
            ];
        };

        return $this->mapPaginator(
            'Stock adjustments report',
            $columns,
            $q,
            $paginate,
            $n,
            $mapRow,
            [
                'branches' => Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
                'warehouses' => Warehouse::query()->where('status', 'active')->orderBy('name')->get(['id', 'name', 'branch_id']),
            ]
        );
    }

    private function saleReturns(Request $request, bool $paginate, int $n): array
    {
        $columns = [
            ['key' => 'id', 'label' => 'ID'],
            ['key' => 'return_number', 'label' => 'Return #'],
            ['key' => 'return_date', 'label' => 'Date'],
            ['key' => 'sale_number', 'label' => 'Sale #'],
            ['key' => 'customer', 'label' => 'Customer'],
            ['key' => 'warehouse', 'label' => 'Warehouse'],
            ['key' => 'status', 'label' => 'Status'],
            ['key' => 'total', 'label' => 'Total'],
            ['key' => 'refund_amount', 'label' => 'Refund'],
        ];

        $q = SaleReturn::query()
            ->with(['sale:id,sale_number', 'customer:id,name', 'warehouse:id,name'])
            ->when($request->query('date_from'), fn (Builder $b, $v) => $b->whereDate('return_date', '>=', $v))
            ->when($request->query('date_to'), fn (Builder $b, $v) => $b->whereDate('return_date', '<=', $v))
            ->when($request->query('warehouse_id'), fn (Builder $b, $v) => $b->where('warehouse_id', (int) $v))
            ->when($request->query('status'), fn (Builder $b, $v) => $b->where('status', $v))
            ->when($request->query('q'), fn (Builder $b, $v) => $b->where('return_number', 'like', '%'.trim((string) $v).'%'))
            ->latest('return_date')
            ->latest('id');

        $mapRow = function (SaleReturn $r): array {
            return [
                'id' => (string) $r->id,
                'return_number' => $r->return_number,
                'return_date' => $r->return_date?->format('Y-m-d') ?? '',
                'sale_number' => $r->sale?->sale_number ?? '—',
                'customer' => $r->customer?->name ?? '—',
                'warehouse' => $r->warehouse?->name ?? '—',
                'status' => (string) $r->status,
                'total' => (string) $r->total,
                'refund_amount' => (string) $r->refund_amount,
            ];
        };

        return $this->mapPaginator(
            'Sale returns report',
            $columns,
            $q,
            $paginate,
            $n,
            $mapRow,
            [
                'warehouses' => Warehouse::query()->where('status', 'active')->orderBy('name')->get(['id', 'name', 'branch_id']),
            ]
        );
    }

    private function sales(Request $request, bool $paginate, int $n): array
    {
        $columns = [
            ['key' => 'id', 'label' => 'ID'],
            ['key' => 'sale_number', 'label' => 'Sale #'],
            ['key' => 'sale_date', 'label' => 'Date'],
            ['key' => 'branch', 'label' => 'Branch'],
            ['key' => 'warehouse', 'label' => 'Warehouse'],
            ['key' => 'customer', 'label' => 'Customer'],
            ['key' => 'status', 'label' => 'Status'],
            ['key' => 'payment_status', 'label' => 'Payment'],
            ['key' => 'total', 'label' => 'Total'],
            ['key' => 'paid', 'label' => 'Paid'],
            ['key' => 'due', 'label' => 'Due'],
        ];

        $selectedIds = $this->normalizeExportIds($request);

        $q = Sale::query()
            ->with(['branch:id,name', 'warehouse:id,name', 'customer:id,name'])
            ->when($selectedIds !== [], fn (Builder $b) => $b->whereIn('id', $selectedIds))
            ->when($request->query('date_from'), fn (Builder $b, $v) => $b->whereDate('sale_date', '>=', $v))
            ->when($request->query('date_to'), fn (Builder $b, $v) => $b->whereDate('sale_date', '<=', $v))
            ->when($request->query('branch_id'), fn (Builder $b, $v) => $b->where('branch_id', (int) $v))
            ->when($request->query('warehouse_id'), fn (Builder $b, $v) => $b->where('warehouse_id', (int) $v))
            ->when($request->query('customer_id'), fn (Builder $b, $v) => $b->where('customer_id', (int) $v))
            ->when($request->query('status'), fn (Builder $b, $v) => $b->where('status', $v))
            ->when($request->query('payment_status'), fn (Builder $b, $v) => $b->where('payment_status', $v))
            ->when($request->query('q'), fn (Builder $b, $v) => $b->where('sale_number', 'like', '%'.trim((string) $v).'%'))
            ->latest('sale_date')
            ->latest('id');

        $mapRow = function (Sale $s): array {
            return [
                'id' => (string) $s->id,
                'sale_number' => $s->sale_number,
                'sale_date' => $s->sale_date?->format('Y-m-d H:i') ?? '',
                'branch' => $s->branch?->name ?? '—',
                'warehouse' => $s->warehouse?->name ?? '—',
                'customer' => $s->customer?->name ?? '—',
                'status' => (string) $s->status,
                'payment_status' => (string) $s->payment_status,
                'total' => (string) $s->total,
                'paid' => (string) $s->paid_amount,
                'due' => (string) $s->due_amount,
            ];
        };

        return $this->mapPaginator(
            'Sales report',
            $columns,
            $q,
            $paginate,
            $n,
            $mapRow,
            [
                'branches' => Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
                'warehouses' => Warehouse::query()->where('status', 'active')->orderBy('name')->get(['id', 'name', 'branch_id']),
                'customers' => Customer::query()->where('status', 'active')->orderBy('name')->limit(500)->get(['id', 'name']),
            ]
        );
    }

    /**
     * @param  callable(object): array<string, string|null>  $mapRow
     * @return array{columns: list<array{key: string, label: string}>, paginator?: LengthAwarePaginator<int, array<string, string|null>>, rows?: list<array<string, string|null>>, filterOptions: array<string, mixed>, title: string}
     */
    private function mapQueryPaginator(string $title, array $columns, \Illuminate\Database\Query\Builder $query, bool $paginate, int $n, callable $mapRow, array $filterOptions = []): array
    {
        $query = clone $query;

        if ($paginate) {
            $paginator = $query->paginate($n)->through($mapRow);

            return [
                'title' => $title,
                'columns' => $columns,
                'paginator' => $paginator,
                'filterOptions' => $filterOptions,
            ];
        }

        $rows = collect($query->limit($n)->get())->map($mapRow)->values()->all();

        return [
            'title' => $title,
            'columns' => $columns,
            'rows' => $rows,
            'filterOptions' => $filterOptions,
        ];
    }

    private function purchaseOrders(Request $request, bool $paginate, int $n): array
    {
        $columns = [
            ['key' => 'id', 'label' => 'ID'],
            ['key' => 'order_number', 'label' => 'Order #'],
            ['key' => 'order_date', 'label' => 'Order date'],
            ['key' => 'expected_date', 'label' => 'Expected'],
            ['key' => 'supplier', 'label' => 'Supplier'],
            ['key' => 'branch', 'label' => 'Branch'],
            ['key' => 'warehouse', 'label' => 'Warehouse'],
            ['key' => 'status', 'label' => 'Status'],
            ['key' => 'lines', 'label' => 'Lines'],
            ['key' => 'ordered_qty', 'label' => 'Ordered qty'],
            ['key' => 'received_qty', 'label' => 'Received qty'],
            ['key' => 'total', 'label' => 'Total'],
        ];

        $q = PurchaseOrder::query()
            ->with(['supplier:id,name', 'branch:id,name', 'warehouse:id,name'])
            ->withCount('items')
            ->withSum('items', 'quantity')
            ->withSum('items', 'received_quantity')
            ->when($request->query('date_from'), fn (Builder $b, $v) => $b->whereDate('order_date', '>=', $v))
            ->when($request->query('date_to'), fn (Builder $b, $v) => $b->whereDate('order_date', '<=', $v))
            ->when($request->query('branch_id'), fn (Builder $b, $v) => $b->where('branch_id', (int) $v))
            ->when($request->query('supplier_id'), fn (Builder $b, $v) => $b->where('supplier_id', (int) $v))
            ->when($request->query('status'), fn (Builder $b, $v) => $b->where('status', $v))
            ->when($request->query('q'), fn (Builder $b, $v) => $b->where('order_number', 'like', '%'.trim((string) $v).'%'))
            ->latest('order_date')
            ->latest('id');

        $mapRow = function (PurchaseOrder $po): array {
            return [
                'id' => (string) $po->id,
                'order_number' => $po->order_number,
                'order_date' => $po->order_date?->format('Y-m-d') ?? '',
                'expected_date' => $po->expected_date?->format('Y-m-d') ?? '',
                'supplier' => $po->supplier?->name ?? '—',
                'branch' => $po->branch?->name ?? '—',
                'warehouse' => $po->warehouse?->name ?? '—',
                'status' => (string) $po->status,
                'lines' => (string) ($po->items_count ?? 0),
                'ordered_qty' => $this->formatReportQty($po->items_sum_quantity ?? 0),
                'received_qty' => $this->formatReportQty($po->items_sum_received_quantity ?? 0),
                'total' => (string) $po->total,
            ];
        };

        return $this->mapPaginator(
            'Purchase orders report',
            $columns,
            $q,
            $paginate,
            $n,
            $mapRow,
            [
                'branches' => Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
                'suppliers' => $this->reportFilterSuppliers(),
            ]
        );
    }

    private function quotationsReport(Request $request, bool $paginate, int $n): array
    {
        $columns = [
            ['key' => 'id', 'label' => 'ID'],
            ['key' => 'quotation_no', 'label' => 'Quotation #'],
            ['key' => 'quotation_date', 'label' => 'Quotation date'],
            ['key' => 'valid_until', 'label' => 'Valid until'],
            ['key' => 'customer', 'label' => 'Customer'],
            ['key' => 'branch', 'label' => 'Branch'],
            ['key' => 'warehouse', 'label' => 'Warehouse'],
            ['key' => 'status', 'label' => 'Status'],
            ['key' => 'lines', 'label' => 'Lines'],
            ['key' => 'subtotal', 'label' => 'Subtotal'],
            ['key' => 'discount_amount', 'label' => 'Discount'],
            ['key' => 'shipping_amount', 'label' => 'Shipping'],
            ['key' => 'tax_amount', 'label' => 'Tax'],
            ['key' => 'total', 'label' => 'Total'],
            ['key' => 'converted_sale', 'label' => 'Converted sale #'],
        ];

        $allowedStatus = ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'];
        $status = (string) $request->query('status', '');
        $statusFilter = in_array($status, $allowedStatus, true) ? $status : null;
        $selectedIds = $this->normalizeExportIds($request);

        $q = Quotation::query()
            ->with(['customer:id,name', 'branch:id,name', 'warehouse:id,name', 'convertedSale:id,sale_number'])
            ->withCount('items')
            ->when($selectedIds !== [], fn (Builder $b) => $b->whereIn('id', $selectedIds))
            ->when($request->query('date_from'), fn (Builder $b, $v) => $b->whereDate('quotation_date', '>=', $v))
            ->when($request->query('date_to'), fn (Builder $b, $v) => $b->whereDate('quotation_date', '<=', $v))
            ->when($request->query('branch_id'), fn (Builder $b, $v) => $b->where('branch_id', (int) $v))
            ->when($request->query('warehouse_id'), fn (Builder $b, $v) => $b->where('warehouse_id', (int) $v))
            ->when($request->query('customer_id'), fn (Builder $b, $v) => $b->where('customer_id', (int) $v))
            ->when($statusFilter, fn (Builder $b, $v) => $b->where('status', $v))
            ->when($request->query('q'), fn (Builder $b, $v) => $b->where('quotation_no', 'like', '%'.trim((string) $v).'%'))
            ->latest('quotation_date')
            ->latest('id');

        $mapRow = function (Quotation $row): array {
            return [
                'id' => (string) $row->id,
                'quotation_no' => $row->quotation_no,
                'quotation_date' => $row->quotation_date?->format('Y-m-d') ?? '',
                'valid_until' => $row->valid_until?->format('Y-m-d') ?? '',
                'customer' => $row->customer?->name ?? '—',
                'branch' => $row->branch?->name ?? '—',
                'warehouse' => $row->warehouse?->name ?? '—',
                'status' => (string) $row->status,
                'lines' => (string) ($row->items_count ?? 0),
                'subtotal' => (string) $row->subtotal,
                'discount_amount' => (string) $row->discount_amount,
                'shipping_amount' => (string) $row->shipping_amount,
                'tax_amount' => (string) $row->tax_amount,
                'total' => (string) $row->total,
                'converted_sale' => $row->convertedSale?->sale_number ?? '',
            ];
        };

        return $this->mapPaginator(
            'Quotations report',
            $columns,
            $q,
            $paginate,
            $n,
            $mapRow,
            [
                'branches' => Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
                'warehouses' => Warehouse::query()->where('status', 'active')->orderBy('name')->get(['id', 'name', 'branch_id']),
                'customers' => Customer::query()->where('status', 'active')->orderBy('name')->limit(500)->get(['id', 'name', 'code']),
            ]
        );
    }

    private function quotationLines(Request $request, bool $paginate, int $n): array
    {
        $columns = [
            ['key' => 'line_id', 'label' => 'Line ID'],
            ['key' => 'quotation_id', 'label' => 'Quotation ID'],
            ['key' => 'quotation_no', 'label' => 'Quotation #'],
            ['key' => 'quotation_date', 'label' => 'Quotation date'],
            ['key' => 'branch', 'label' => 'Branch'],
            ['key' => 'warehouse', 'label' => 'Warehouse'],
            ['key' => 'customer', 'label' => 'Customer'],
            ['key' => 'quotation_status', 'label' => 'Quote status'],
            ['key' => 'product', 'label' => 'Product'],
            ['key' => 'variant', 'label' => 'Variant'],
            ['key' => 'billing_mode', 'label' => 'Billing mode'],
            ['key' => 'lengths_lxq', 'label' => 'Lengths (L×Q)'],
            ['key' => 'quantity', 'label' => 'Qty'],
            ['key' => 'unit_price', 'label' => 'Unit price'],
            ['key' => 'subtotal', 'label' => 'Line subtotal'],
            ['key' => 'tax_amount', 'label' => 'Tax'],
            ['key' => 'discount_amount', 'label' => 'Discount'],
            ['key' => 'line_total', 'label' => 'Line total'],
            ['key' => 'notes', 'label' => 'Line notes'],
        ];

        $allowedStatus = ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'];
        $status = (string) $request->query('status', '');
        $statusFilter = in_array($status, $allowedStatus, true) ? $status : null;

        $rawQ = $request->query('q');
        $needle = is_string($rawQ) && trim($rawQ) !== '' ? '%'.trim($rawQ).'%' : null;

        $applyQuotationFilters = function (Builder $q) use ($request, $statusFilter): void {
            $q->when($request->query('date_from'), fn (Builder $b, $v) => $b->whereDate('quotation_date', '>=', $v))
                ->when($request->query('date_to'), fn (Builder $b, $v) => $b->whereDate('quotation_date', '<=', $v))
                ->when($request->query('branch_id'), fn (Builder $b, $v) => $b->where('branch_id', (int) $v))
                ->when($request->query('warehouse_id'), fn (Builder $b, $v) => $b->where('warehouse_id', (int) $v))
                ->when($request->query('customer_id'), fn (Builder $b, $v) => $b->where('customer_id', (int) $v))
                ->when($statusFilter, fn (Builder $b, $v) => $b->where('status', $v));
        };

        $selectedIds = $this->normalizeExportIds($request);

        $q = QuotationItem::query()
            ->with([
                'quotation' => fn ($rel) => $rel->with(['branch:id,name', 'warehouse:id,name', 'customer:id,name']),
                'product:id,name',
                'productVarient:id,name',
            ])
            ->when($selectedIds !== [], fn (Builder $b) => $b->whereIn('id', $selectedIds))
            ->when($needle === null, fn (Builder $b) => $b->whereHas('quotation', $applyQuotationFilters))
            ->when($needle !== null, function (Builder $b) use ($applyQuotationFilters, $needle): void {
                $b->where(function (Builder $outer) use ($applyQuotationFilters, $needle): void {
                    $outer
                        ->whereHas('quotation', function (Builder $q) use ($applyQuotationFilters, $needle): void {
                            $applyQuotationFilters($q);
                            $q->where('quotation_no', 'like', $needle);
                        })
                        ->orWhere(function (Builder $w) use ($applyQuotationFilters, $needle): void {
                            $w->whereHas('quotation', $applyQuotationFilters)
                                ->whereHas('product', fn (Builder $p) => $p->where('name', 'like', $needle));
                        });
                });
            })
            ->latest('id');

        $mapRow = function (QuotationItem $line): array {
            $qt = $line->quotation;
            $billing = (string) ($line->billing_mode ?? 'quantity');
            $rawPairs = is_array($line->length_pairs) ? $line->length_pairs : [];

            $lengthsLxq = '—';
            if ($billing === 'length_ft') {
                $lengthsLxq = $this->stockLengthsLxQSummary($rawPairs);
                if ($lengthsLxq === '—') {
                    $qtyFt = (float) ($line->quantity ?? 0);
                    if ($qtyFt > 0) {
                        $lengthsLxq = $this->formatReportQty($qtyFt).'×1';
                    }
                }
            }

            return [
                'id' => (string) $line->id,
                'line_id' => (string) $line->id,
                'quotation_id' => $qt ? (string) $qt->id : '',
                'quotation_no' => $qt?->quotation_no ?? '—',
                'quotation_date' => $qt?->quotation_date?->format('Y-m-d') ?? '',
                'branch' => $qt?->branch?->name ?? '—',
                'warehouse' => $qt?->warehouse?->name ?? '—',
                'customer' => $qt?->customer?->name ?? '—',
                'quotation_status' => $qt ? (string) $qt->status : '',
                'product' => $line->product?->name ?? '—',
                'variant' => $line->productVarient?->name ?? '',
                'billing_mode' => $billing,
                'lengths_lxq' => $lengthsLxq,
                'quantity' => $this->formatReportQty($line->quantity ?? 0),
                'unit_price' => (string) $line->unit_price,
                'subtotal' => (string) $line->subtotal,
                'tax_amount' => (string) $line->tax_amount,
                'discount_amount' => (string) $line->discount_amount,
                'line_total' => (string) $line->line_total,
                'notes' => $line->notes !== null && $line->notes !== '' ? (string) $line->notes : '',
            ];
        };

        return $this->mapPaginator(
            'Quotation lines report',
            $columns,
            $q,
            $paginate,
            $n,
            $mapRow,
            [
                'branches' => Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
                'warehouses' => Warehouse::query()->where('status', 'active')->orderBy('name')->get(['id', 'name', 'branch_id']),
                'customers' => Customer::query()->where('status', 'active')->orderBy('name')->limit(500)->get(['id', 'name', 'code']),
            ]
        );
    }

    private function purchaseOrderNotifications(Request $request, bool $paginate, int $n): array
    {
        $columns = [
            ['key' => 'id', 'label' => 'ID'],
            ['key' => 'logged_at', 'label' => 'Logged at'],
            ['key' => 'order_number', 'label' => 'Order #'],
            ['key' => 'supplier', 'label' => 'Supplier'],
            ['key' => 'branch', 'label' => 'Branch'],
            ['key' => 'user', 'label' => 'User'],
            ['key' => 'email_status', 'label' => 'Email status'],
            ['key' => 'email_detail', 'label' => 'Email detail'],
            ['key' => 'whatsapp_status', 'label' => 'WhatsApp status'],
            ['key' => 'whatsapp_detail', 'label' => 'WhatsApp detail'],
        ];

        $selectedIds = $this->normalizeExportIds($request);

        $q = PurchaseOrderNotificationLog::query()
            ->with([
                'purchaseOrder:id,order_number,supplier_id,branch_id',
                'purchaseOrder.supplier:id,name',
                'purchaseOrder.branch:id,name',
                'user:id,name',
            ])
            ->when($selectedIds !== [], fn (Builder $b) => $b->whereIn('purchase_order_notification_logs.id', $selectedIds))
            ->when($request->query('date_from'), fn (Builder $b, $v) => $b->whereDate('purchase_order_notification_logs.created_at', '>=', $v))
            ->when($request->query('date_to'), fn (Builder $b, $v) => $b->whereDate('purchase_order_notification_logs.created_at', '<=', $v))
            ->when($request->query('branch_id'), fn (Builder $b, $v) => $b->whereHas('purchaseOrder', fn (Builder $po) => $po->where('branch_id', (int) $v)))
            ->when($request->query('supplier_id'), fn (Builder $b, $v) => $b->whereHas('purchaseOrder', fn (Builder $po) => $po->where('supplier_id', (int) $v)))
            ->when($request->query('email_status'), fn (Builder $b, $v) => $b->where('purchase_order_notification_logs.email_status', $v))
            ->when($request->query('whatsapp_status'), fn (Builder $b, $v) => $b->where('purchase_order_notification_logs.whatsapp_status', $v))
            ->when($request->query('q'), fn (Builder $b, $v) => $b->whereHas('purchaseOrder', fn (Builder $po) => $po->where('order_number', 'like', '%'.trim((string) $v).'%')))
            ->latest('purchase_order_notification_logs.created_at')
            ->latest('purchase_order_notification_logs.id');

        $mapRow = function (PurchaseOrderNotificationLog $log): array {
            return [
                'id' => (string) $log->id,
                'logged_at' => $log->created_at?->format('Y-m-d H:i:s') ?? '',
                'order_number' => $log->purchaseOrder?->order_number ?? '—',
                'supplier' => $log->purchaseOrder?->supplier?->name ?? '—',
                'branch' => $log->purchaseOrder?->branch?->name ?? '—',
                'user' => $log->user?->name ?? '—',
                'email_status' => (string) $log->email_status,
                'email_detail' => $log->email_detail ?? '',
                'whatsapp_status' => (string) $log->whatsapp_status,
                'whatsapp_detail' => $log->whatsapp_detail ?? '',
            ];
        };

        return $this->mapPaginator(
            'Purchase order supplier notifications',
            $columns,
            $q,
            $paginate,
            $n,
            $mapRow,
            [
                'branches' => Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
                'suppliers' => $this->reportFilterSuppliers(),
            ]
        );
    }

    private function supplierAging(Request $request, bool $paginate, int $n): array
    {
        $columns = [
            ['key' => 'id', 'label' => 'ID'],
            ['key' => 'invoice_number', 'label' => 'Invoice #'],
            ['key' => 'invoice_date', 'label' => 'Invoice date'],
            ['key' => 'due_date', 'label' => 'Due date'],
            ['key' => 'supplier', 'label' => 'Supplier'],
            ['key' => 'branch', 'label' => 'Branch'],
            ['key' => 'total', 'label' => 'Total'],
            ['key' => 'paid_amount', 'label' => 'Paid'],
            ['key' => 'due_amount', 'label' => 'Due'],
            ['key' => 'days_outstanding', 'label' => 'Days open'],
            ['key' => 'aging_bucket', 'label' => 'Aging'],
        ];

        $q = PurchaseInvoice::query()
            ->with(['supplier:id,name', 'branch:id,name'])
            ->where('due_amount', '>', 0)
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->when($request->query('branch_id'), fn (Builder $b, $v) => $b->where('branch_id', (int) $v))
            ->when($request->query('supplier_id'), fn (Builder $b, $v) => $b->where('supplier_id', (int) $v))
            ->latest('invoice_date')
            ->latest('id');

        $mapRow = function (PurchaseInvoice $p): array {
            $anchor = $p->due_date ?? $p->invoice_date;
            $daysOutstanding = 0;
            if ($anchor) {
                $today = now()->startOfDay();
                $anchorDay = $anchor->copy()->startOfDay();
                if ($anchorDay->lte($today)) {
                    $daysOutstanding = (int) $anchorDay->diffInDays($today);
                }
            }

            return [
                'id' => (string) $p->id,
                'invoice_number' => $p->invoice_number,
                'invoice_date' => $p->invoice_date?->format('Y-m-d') ?? '',
                'due_date' => $p->due_date?->format('Y-m-d') ?? '',
                'supplier' => $p->supplier?->name ?? '—',
                'branch' => $p->branch?->name ?? '—',
                'total' => (string) $p->total,
                'paid_amount' => (string) $p->paid_amount,
                'due_amount' => (string) $p->due_amount,
                'days_outstanding' => (string) $daysOutstanding,
                'aging_bucket' => $this->agingBucketLabel($daysOutstanding),
            ];
        };

        return $this->mapPaginator(
            'Supplier outstanding (aging)',
            $columns,
            $q,
            $paginate,
            $n,
            $mapRow,
            [
                'branches' => Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
                'suppliers' => $this->reportFilterSuppliers(),
            ]
        );
    }

    private function customerAging(Request $request, bool $paginate, int $n): array
    {
        $columns = [
            ['key' => 'id', 'label' => 'ID'],
            ['key' => 'sale_number', 'label' => 'Sale #'],
            ['key' => 'sale_date', 'label' => 'Sale date'],
            ['key' => 'customer', 'label' => 'Customer'],
            ['key' => 'branch', 'label' => 'Branch'],
            ['key' => 'warehouse', 'label' => 'Warehouse'],
            ['key' => 'total', 'label' => 'Total'],
            ['key' => 'paid_amount', 'label' => 'Paid'],
            ['key' => 'due_amount', 'label' => 'Due'],
            ['key' => 'days_outstanding', 'label' => 'Days open'],
            ['key' => 'aging_bucket', 'label' => 'Aging'],
        ];

        $q = Sale::query()
            ->with(['customer:id,name', 'branch:id,name', 'warehouse:id,name'])
            ->where('due_amount', '>', 0)
            ->whereNotIn('status', ['cancelled', 'returned', 'draft'])
            ->when($request->query('branch_id'), fn (Builder $b, $v) => $b->where('branch_id', (int) $v))
            ->when($request->query('customer_id'), fn (Builder $b, $v) => $b->where('customer_id', (int) $v))
            ->latest('sale_date')
            ->latest('id');

        $mapRow = function (Sale $s): array {
            $anchor = $s->sale_date;
            $daysOutstanding = 0;
            if ($anchor) {
                $today = now()->startOfDay();
                $anchorDay = $anchor->copy()->startOfDay();
                if ($anchorDay->lte($today)) {
                    $daysOutstanding = (int) $anchorDay->diffInDays($today);
                }
            }

            return [
                'id' => (string) $s->id,
                'sale_number' => $s->sale_number,
                'sale_date' => $s->sale_date?->format('Y-m-d H:i') ?? '',
                'customer' => $s->customer?->name ?? 'Walk-in',
                'branch' => $s->branch?->name ?? '—',
                'warehouse' => $s->warehouse?->name ?? '—',
                'total' => (string) $s->total,
                'paid_amount' => (string) $s->paid_amount,
                'due_amount' => (string) $s->due_amount,
                'days_outstanding' => (string) $daysOutstanding,
                'aging_bucket' => $this->agingBucketLabel($daysOutstanding),
            ];
        };

        return $this->mapPaginator(
            'Customer outstanding (aging)',
            $columns,
            $q,
            $paginate,
            $n,
            $mapRow,
            [
                'branches' => Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
                'customers' => Customer::query()->where('status', 'active')->orderBy('name')->limit(500)->get(['id', 'name']),
            ]
        );
    }

    private function customerDueRegister(Request $request, bool $paginate, int $n): array
    {
        $columns = [
            ['key' => 'id', 'label' => 'ID'],
            ['key' => 'branch', 'label' => 'Branch'],
            ['key' => 'customer', 'label' => 'Customer'],
            ['key' => 'source_type', 'label' => 'Source'],
            ['key' => 'sale_number', 'label' => 'Sale #'],
            ['key' => 'reference_no', 'label' => 'Reference'],
            ['key' => 'product_line', 'label' => 'Product / variant'],
            ['key' => 'transaction_date', 'label' => 'Txn date'],
            ['key' => 'due_date', 'label' => 'Due date'],
            ['key' => 'original_amount', 'label' => 'Original'],
            ['key' => 'paid_amount', 'label' => 'Paid'],
            ['key' => 'adjusted_amount', 'label' => 'Adjusted'],
            ['key' => 'balance_amount', 'label' => 'Balance'],
            ['key' => 'status', 'label' => 'Status'],
            ['key' => 'notes', 'label' => 'Notes'],
        ];

        $allowedStatus = ['unpaid', 'partial', 'paid', 'written_off', 'cancelled'];
        $status = (string) $request->query('status', '');
        $statusFilter = in_array($status, $allowedStatus, true) ? $status : null;

        $allowedSource = ['old_balance', 'sale', 'manual'];
        $sourceType = (string) $request->query('source_type', '');
        $sourceFilter = in_array($sourceType, $allowedSource, true) ? $sourceType : null;

        $q = CustomerDueItem::query()
            ->with(['customer:id,name', 'branch:id,name', 'sale:id,sale_number'])
            ->when($request->query('date_from'), fn (Builder $b, $v) => $b->whereDate('transaction_date', '>=', $v))
            ->when($request->query('date_to'), fn (Builder $b, $v) => $b->whereDate('transaction_date', '<=', $v))
            ->when($request->query('branch_id'), fn (Builder $b, $v) => $b->where('branch_id', (int) $v))
            ->when($request->query('customer_id'), fn (Builder $b, $v) => $b->where('customer_id', (int) $v))
            ->when($statusFilter, fn (Builder $b, $v) => $b->where('status', $v))
            ->when($sourceFilter, fn (Builder $b, $v) => $b->where('source_type', $v))
            ->when($request->query('q'), function (Builder $b, $v): void {
                $needle = '%'.trim((string) $v).'%';
                $b->where(function (Builder $inner) use ($needle): void {
                    $inner
                        ->where('reference_no', 'like', $needle)
                        ->orWhere('notes', 'like', $needle)
                        ->orWhere('product_name', 'like', $needle)
                        ->orWhere('variant_name', 'like', $needle);
                });
            })
            ->latest('transaction_date')
            ->latest('id');

        $mapRow = function (CustomerDueItem $row): array {
            $productLine = trim(implode(' ', array_filter([
                (string) ($row->product_name ?? ''),
                (string) ($row->variant_name ?? ''),
            ])));

            return [
                'id' => (string) $row->id,
                'branch' => $row->branch?->name ?? '—',
                'customer' => $row->customer?->name ?? '—',
                'source_type' => (string) $row->source_type,
                'sale_number' => $row->sale?->sale_number ?? '',
                'reference_no' => $row->reference_no ?? '',
                'product_line' => $productLine !== '' ? $productLine : '—',
                'transaction_date' => $row->transaction_date?->format('Y-m-d') ?? '',
                'due_date' => $row->due_date?->format('Y-m-d') ?? '',
                'original_amount' => (string) $row->original_amount,
                'paid_amount' => (string) $row->paid_amount,
                'adjusted_amount' => (string) $row->adjusted_amount,
                'balance_amount' => (string) $row->balance_amount,
                'status' => (string) $row->status,
                'notes' => $row->notes !== null && $row->notes !== '' ? (string) $row->notes : '',
            ];
        };

        return $this->mapPaginator(
            'Customer balances register',
            $columns,
            $q,
            $paginate,
            $n,
            $mapRow,
            [
                'branches' => Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
                'customers' => Customer::query()->where('status', 'active')->orderBy('name')->limit(500)->get(['id', 'name']),
                'status_options' => [
                    ['value' => 'unpaid', 'label' => 'Unpaid'],
                    ['value' => 'partial', 'label' => 'Partial'],
                    ['value' => 'paid', 'label' => 'Paid'],
                    ['value' => 'written_off', 'label' => 'Written off'],
                    ['value' => 'cancelled', 'label' => 'Cancelled'],
                ],
                'source_type_options' => [
                    ['value' => 'old_balance', 'label' => 'Opening / old balance'],
                    ['value' => 'sale', 'label' => 'Sale'],
                    ['value' => 'manual', 'label' => 'Manual'],
                ],
            ]
        );
    }

    private function productSalesSummary(Request $request, bool $paginate, int $n): array
    {
        $dateFrom = $request->query('date_from') ?: now()->subDays(30)->toDateString();
        $dateTo = $request->query('date_to') ?: now()->toDateString();
        $groupBy = strtolower((string) $request->query('group_by', 'product')) === 'category' ? 'category' : 'product';

        $sharedJoin = function (\Illuminate\Database\Query\Builder $q) use ($request, $dateFrom, $dateTo): void {
            $q->join('sales', 'sales.id', '=', 'sale_items.sale_id')
                ->join('products', 'products.id', '=', 'sale_items.product_id')
                ->whereNull('sale_items.deleted_at')
                ->whereNull('sales.deleted_at')
                ->whereNull('products.deleted_at')
                ->where('sales.status', 'completed')
                ->whereDate('sales.sale_date', '>=', $dateFrom)
                ->whereDate('sales.sale_date', '<=', $dateTo)
                ->when($request->query('branch_id'), fn (\Illuminate\Database\Query\Builder $b, $v) => $b->where('sales.branch_id', (int) $v))
                ->when($request->query('warehouse_id'), fn (\Illuminate\Database\Query\Builder $b, $v) => $b->where('sales.warehouse_id', (int) $v));
        };

        $filterOptions = [
            'branches' => Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
            'warehouses' => Warehouse::query()->where('status', 'active')->orderBy('name')->get(['id', 'name', 'branch_id']),
            'group_by_options' => [
                ['value' => 'product', 'label' => 'By product'],
                ['value' => 'category', 'label' => 'By category'],
            ],
            'effective_date_from' => $dateFrom,
            'effective_date_to' => $dateTo,
        ];

        if ($groupBy === 'category') {
            $columns = [
                ['key' => 'category_id', 'label' => 'Cat ID'],
                ['key' => 'category', 'label' => 'Category'],
                ['key' => 'qty_sold', 'label' => 'Qty sold'],
                ['key' => 'sale_amount', 'label' => 'Sale amount'],
            ];

            $q = DB::table('sale_items')
                ->tap(fn (\Illuminate\Database\Query\Builder $builder) => $sharedJoin($builder))
                ->join('categories', 'categories.id', '=', 'products.category_id')
                ->whereNull('categories.deleted_at')
                ->groupBy('categories.id', 'categories.name')
                ->orderByDesc(DB::raw('SUM(sale_items.quantity)'))
                ->select([
                    'categories.id as category_id',
                    'categories.name as category',
                    DB::raw('SUM(sale_items.quantity) as qty_sold'),
                    DB::raw('SUM(sale_items.subtotal) as sale_amount'),
                ]);

            $mapRow = function ($row): array {
                return [
                    'category_id' => (string) $row->category_id,
                    'category' => (string) $row->category,
                    'qty_sold' => $this->formatReportQty($row->qty_sold ?? 0),
                    'sale_amount' => number_format((float) ($row->sale_amount ?? 0), 2, '.', ''),
                ];
            };

            return $this->mapQueryPaginator(
                'Product sales summary (by category)',
                $columns,
                $q,
                $paginate,
                $n,
                $mapRow,
                $filterOptions
            );
        }

        $columns = [
            ['key' => 'product_id', 'label' => 'Product ID'],
            ['key' => 'product', 'label' => 'Product'],
            ['key' => 'category', 'label' => 'Category'],
            ['key' => 'qty_sold', 'label' => 'Qty sold'],
            ['key' => 'sale_amount', 'label' => 'Sale amount'],
        ];

        $q = DB::table('sale_items')
            ->tap(fn (\Illuminate\Database\Query\Builder $builder) => $sharedJoin($builder))
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->whereNull('categories.deleted_at')
            ->groupBy('sale_items.product_id', 'products.name', 'categories.name')
            ->orderByDesc(DB::raw('SUM(sale_items.quantity)'))
            ->select([
                'sale_items.product_id',
                'products.name as product',
                'categories.name as category',
                DB::raw('SUM(sale_items.quantity) as qty_sold'),
                DB::raw('SUM(sale_items.subtotal) as sale_amount'),
            ]);

        $mapRow = function ($row): array {
            return [
                'product_id' => (string) $row->product_id,
                'product' => (string) $row->product,
                'category' => (string) $row->category,
                'qty_sold' => $this->formatReportQty($row->qty_sold ?? 0),
                'sale_amount' => number_format((float) ($row->sale_amount ?? 0), 2, '.', ''),
            ];
        };

        return $this->mapQueryPaginator(
            'Product sales summary (by product)',
            $columns,
            $q,
            $paginate,
            $n,
            $mapRow,
            $filterOptions
        );
    }

    private function stockValuation(Request $request, bool $paginate, int $n): array
    {
        $columns = [
            ['key' => 'id', 'label' => 'ID'],
            ['key' => 'product', 'label' => 'Product'],
            ['key' => 'variant', 'label' => 'Variant'],
            ['key' => 'warehouse', 'label' => 'Warehouse'],
            ['key' => 'branch', 'label' => 'Branch'],
            ['key' => 'lengths_lxq', 'label' => 'Lengths (L×Q)'],
            ['key' => 'qty_on_hand', 'label' => 'Qty'],
            ['key' => 'unit_cost', 'label' => 'Unit cost'],
            ['key' => 'cost_source', 'label' => 'Cost basis'],
            ['key' => 'stock_value', 'label' => 'Value'],
        ];

        $avgMap = $this->averagePurchaseUnitCostMap();
        $costBasis = strtolower((string) $request->query('cost_basis', 'variant_preferred'));
        $selectedIds = $this->normalizeExportIds($request);

        $q = Stock::query()
            ->with([
                'product:id,name',
                'productVarient:id,product_id,name,sku,cost_price',
                'warehouse:id,name,branch_id',
                'warehouse.branch:id,name',
            ])
            ->when($selectedIds !== [], fn (Builder $b) => $b->whereIn('id', $selectedIds))
            ->when($request->query('q'), function (Builder $b, $v) {
                $t = '%'.trim((string) $v).'%';
                $b->whereHas('product', fn ($qq) => $qq->where('name', 'like', $t))
                    ->orWhereHas('productVarient', fn ($qq) => $qq->where('sku', 'like', $t));
            })
            ->when($request->query('warehouse_id'), fn (Builder $b, $v) => $b->where('warehouse_id', (int) $v))
            ->when($request->query('product_id'), fn (Builder $b, $v) => $b->where('product_id', (int) $v))
            ->when($request->query('branch_id'), function (Builder $b, $v) {
                $b->whereHas('warehouse', fn ($qq) => $qq->where('branch_id', (int) $v));
            })
            ->latest('id');

        $mapRow = function (Stock $s) use ($avgMap, $costBasis): array {
            $pk = $s->product_id.'|'.($s->product_variant_id ?? '0');
            $pOnly = $s->product_id.'|0';
            $avgPurchase = (float) ($avgMap[$pk] ?? $avgMap[$pOnly] ?? 0);

            $unitCost = 0.0;
            $source = '—';

            if ($costBasis === 'avg_purchase_only') {
                $unitCost = $avgPurchase;
                $source = 'Avg purchase';
            } elseif ($s->product_variant_id && $s->productVarient && $s->productVarient->cost_price !== null && (float) $s->productVarient->cost_price > 0) {
                $unitCost = (float) $s->productVarient->cost_price;
                $source = 'Variant cost';
            } else {
                $unitCost = $avgPurchase;
                $source = $avgPurchase > 0 ? 'Avg purchase (fallback)' : '—';
            }

            $billing = (string) ($s->billing_mode ?? 'quantity');
            $rawPairs = is_array($s->length_pairs) ? $s->length_pairs : [];

            $lengthsLxq = '—';
            $qtyOnHand = '—';

            if ($billing === 'length_ft') {
                $lengthsLxq = $this->stockLengthsLxQSummary($rawPairs);
                if ($lengthsLxq === '—') {
                    $qtyFt = (float) $s->quantity;
                    if ($qtyFt > 0) {
                        $lengthsLxq = $this->formatReportQty($qtyFt).'×1';
                    }
                }
                $qtyOnHand = $this->formatReportQty($s->quantity);
            } else {
                $qtyOnHand = $this->formatReportQty($s->quantity);
            }

            $qty = (float) $s->quantity;
            $stockValue = round($qty * $unitCost, 2);

            return [
                'id' => (string) $s->id,
                'product' => $s->product?->name ?? '—',
                'variant' => $s->productVarient?->sku ?? $s->productVarient?->name ?? '—',
                'warehouse' => $s->warehouse?->name ?? '—',
                'branch' => $s->warehouse?->branch?->name ?? '—',
                'lengths_lxq' => $lengthsLxq,
                'qty_on_hand' => $qtyOnHand,
                'unit_cost' => number_format($unitCost, 2, '.', ''),
                'cost_source' => $source,
                'stock_value' => number_format($stockValue, 2, '.', ''),
            ];
        };

        return $this->mapPaginator(
            'Stock valuation',
            $columns,
            $q,
            $paginate,
            $n,
            $mapRow,
            [
                'branches' => Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
                'warehouses' => Warehouse::query()->where('status', 'active')->orderBy('name')->get(['id', 'name', 'branch_id']),
                'products' => Product::query()->where('status', 'active')->orderBy('name')->limit(300)->get(['id', 'name']),
                'cost_basis_options' => [
                    ['value' => 'variant_preferred', 'label' => 'Variant cost, else avg purchase'],
                    ['value' => 'avg_purchase_only', 'label' => 'Avg purchase only'],
                ],
            ]
        );
    }

    private function profitMargin(Request $request, bool $paginate, int $n): array
    {
        $columns = [
            ['key' => 'id', 'label' => 'ID'],
            ['key' => 'sale_number', 'label' => 'Sale #'],
            ['key' => 'sale_date', 'label' => 'Date'],
            ['key' => 'branch', 'label' => 'Branch'],
            ['key' => 'net_revenue', 'label' => 'Net revenue (subtotal)'],
            ['key' => 'cogs', 'label' => 'COGS'],
            ['key' => 'gross_profit', 'label' => 'Gross profit'],
            ['key' => 'margin_pct', 'label' => 'Margin %'],
            ['key' => 'cost_signal', 'label' => 'Cost data'],
        ];

        $avgMap = $this->averagePurchaseUnitCostMap();
        $costBasis = strtolower((string) $request->query('cost_basis', 'variant_preferred'));
        $selectedIds = $this->normalizeExportIds($request);

        $q = Sale::query()
            ->with([
                'branch:id,name',
                'items.productVarient:id,product_id,name,sku,cost_price',
            ])
            ->where('status', 'completed')
            ->when($selectedIds !== [], fn (Builder $b) => $b->whereIn('id', $selectedIds))
            ->when($request->query('date_from'), fn (Builder $b, $v) => $b->whereDate('sale_date', '>=', $v))
            ->when($request->query('date_to'), fn (Builder $b, $v) => $b->whereDate('sale_date', '<=', $v))
            ->when($request->query('branch_id'), fn (Builder $b, $v) => $b->where('branch_id', (int) $v))
            ->when($request->query('warehouse_id'), fn (Builder $b, $v) => $b->where('warehouse_id', (int) $v))
            ->when($request->query('customer_id'), fn (Builder $b, $v) => $b->where('customer_id', (int) $v))
            ->when($request->query('q'), fn (Builder $b, $v) => $b->where('sale_number', 'like', '%'.trim((string) $v).'%'))
            ->latest('sale_date')
            ->latest('id');

        $mapRow = function (Sale $sale) use ($avgMap, $costBasis): array {
            $cogs = 0.0;
            $weakCost = false;
            foreach ($sale->items as $line) {
                $qty = (float) $line->quantity;
                $unit = $this->resolveSaleLineUnitCost($line, $avgMap, $costBasis);
                if ($qty > 0 && $unit <= 0) {
                    $weakCost = true;
                }
                $cogs += $qty * $unit;
            }
            $cogs = round($cogs, 2);
            $net = (float) $sale->subtotal;
            $gp = round($net - $cogs, 2);
            $mrg = $net > 0 ? round($gp / $net * 100, 2) : 0.0;

            return [
                'id' => (string) $sale->id,
                'sale_number' => $sale->sale_number,
                'sale_date' => $sale->sale_date?->format('Y-m-d H:i') ?? '',
                'branch' => $sale->branch?->name ?? '—',
                'net_revenue' => number_format($net, 2, '.', ''),
                'cogs' => number_format($cogs, 2, '.', ''),
                'gross_profit' => number_format($gp, 2, '.', ''),
                'margin_pct' => number_format($mrg, 2, '.', ''),
                'cost_signal' => $weakCost ? 'Missing/zero unit cost on lines' : 'OK',
            ];
        };

        return $this->mapPaginator(
            'Profit margin (completed sales)',
            $columns,
            $q,
            $paginate,
            $n,
            $mapRow,
            [
                'branches' => Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
                'warehouses' => Warehouse::query()->where('status', 'active')->orderBy('name')->get(['id', 'name', 'branch_id']),
                'customers' => Customer::query()->where('status', 'active')->orderBy('name')->limit(500)->get(['id', 'name']),
                'cost_basis_options' => [
                    ['value' => 'variant_preferred', 'label' => 'Variant cost, else avg purchase'],
                    ['value' => 'avg_purchase_only', 'label' => 'Avg purchase only'],
                ],
                'report_notes' => [
                    'COGS uses the same rules as stock valuation (variant cost or average purchase from posted supplier invoices). Margins are wrong if costs are incomplete.',
                ],
            ]
        );
    }

    private function taxSummary(Request $request, bool $paginate, int $n): array
    {
        $columns = [
            ['key' => 'period', 'label' => 'Period'],
            ['key' => 'branch', 'label' => 'Branch'],
            ['key' => 'sales_taxable', 'label' => 'Sales subtotal'],
            ['key' => 'sales_tax', 'label' => 'Sales tax'],
            ['key' => 'purchase_taxable', 'label' => 'Purchases subtotal'],
            ['key' => 'purchase_tax', 'label' => 'Purchase tax'],
            ['key' => 'net_tax', 'label' => 'Net tax (sales − purchase)'],
        ];

        $saleMonth = $this->sqlMonthPeriod('s.sale_date');
        $saleQuery = DB::table('sales as s')
            ->join('branches as b', 'b.id', '=', 's.branch_id')
            ->whereNull('s.deleted_at')
            ->where('s.status', 'completed')
            ->when($request->query('date_from'), fn ($q, $v) => $q->whereDate('s.sale_date', '>=', $v))
            ->when($request->query('date_to'), fn ($q, $v) => $q->whereDate('s.sale_date', '<=', $v))
            ->when($request->query('branch_id'), fn ($q, $v) => $q->where('s.branch_id', (int) $v))
            ->groupBy(DB::raw($saleMonth), 's.branch_id', 'b.name')
            ->orderByDesc(DB::raw($saleMonth))
            ->orderBy('b.name')
            ->select([
                DB::raw($saleMonth.' as period'),
                's.branch_id',
                'b.name as branch_name',
                DB::raw('SUM(s.subtotal) as sales_taxable'),
                DB::raw('SUM(s.tax_amount) as sales_tax'),
            ]);

        $piMonth = $this->sqlMonthPeriod('pi.invoice_date');
        $purchaseQuery = DB::table('purchase_invoices as pi')
            ->join('branches as b', 'b.id', '=', 'pi.branch_id')
            ->whereNull('pi.deleted_at')
            ->whereNotIn('pi.status', ['draft', 'cancelled'])
            ->when($request->query('date_from'), fn ($q, $v) => $q->whereDate('pi.invoice_date', '>=', $v))
            ->when($request->query('date_to'), fn ($q, $v) => $q->whereDate('pi.invoice_date', '<=', $v))
            ->when($request->query('branch_id'), fn ($q, $v) => $q->where('pi.branch_id', (int) $v))
            ->groupBy(DB::raw($piMonth), 'pi.branch_id', 'b.name')
            ->select([
                DB::raw($piMonth.' as period'),
                'pi.branch_id',
                'b.name as branch_name',
                DB::raw('SUM(pi.subtotal) as purchase_taxable'),
                DB::raw('SUM(pi.tax_amount) as purchase_tax'),
            ]);

        $keyFn = static fn (string $period, int $branchId): string => $period.'|'.$branchId;

        $saleMap = [];
        foreach ($saleQuery->get() as $row) {
            $saleMap[$keyFn((string) $row->period, (int) $row->branch_id)] = $row;
        }
        $purchaseMap = [];
        foreach ($purchaseQuery->get() as $row) {
            $purchaseMap[$keyFn((string) $row->period, (int) $row->branch_id)] = $row;
        }

        $keys = collect(array_merge(array_keys($saleMap), array_keys($purchaseMap)))
            ->unique()
            ->sort(static function (string $a, string $b): int {
                [$pa, $ba] = explode('|', $a, 2);
                [$pb, $bb] = explode('|', $b, 2);
                $c = strcmp($pb, $pa);

                return $c !== 0 ? $c : strcmp((string) $ba, (string) $bb);
            })
            ->values()
            ->all();

        $rows = [];
        foreach ($keys as $key) {
            [$period] = explode('|', $key, 2);
            $sr = $saleMap[$key] ?? null;
            $pr = $purchaseMap[$key] ?? null;
            $branchName = $sr->branch_name ?? $pr->branch_name ?? '—';
            $st = (float) ($sr->sales_tax ?? 0);
            $pt = (float) ($pr->purchase_tax ?? 0);
            $rows[] = [
                'period' => $period,
                'branch' => $branchName,
                'sales_taxable' => number_format((float) ($sr->sales_taxable ?? 0), 2, '.', ''),
                'sales_tax' => number_format($st, 2, '.', ''),
                'purchase_taxable' => number_format((float) ($pr->purchase_taxable ?? 0), 2, '.', ''),
                'purchase_tax' => number_format($pt, 2, '.', ''),
                'net_tax' => number_format(round($st - $pt, 2), 2, '.', ''),
            ];
        }

        return $this->manualTablePayload(
            'Tax summary (by month & branch)',
            $columns,
            $rows,
            $request,
            $paginate,
            $n,
            [
                'branches' => Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
                'report_notes' => [
                    'Uses invoice-level subtotals and tax_amount from completed sales and non-draft purchase invoices.',
                ],
            ]
        );
    }

    private function discountAnalysis(Request $request, bool $paginate, int $n): array
    {
        $slice = strtolower((string) $request->query('slice', 'branch'));
        if (! in_array($slice, ['branch', 'cashier', 'product', 'month'], true)) {
            $slice = 'branch';
        }

        $columns = match ($slice) {
            'cashier' => [
                ['key' => 'cashier', 'label' => 'Cashier'],
                ['key' => 'line_discounts', 'label' => 'Line discounts'],
                ['key' => 'invoice_discounts', 'label' => 'Invoice discounts'],
                ['key' => 'total_discounts', 'label' => 'Total'],
            ],
            'product' => [
                ['key' => 'product', 'label' => 'Product'],
                ['key' => 'line_discounts', 'label' => 'Line discounts'],
                ['key' => 'invoice_discounts', 'label' => 'Invoice discounts'],
                ['key' => 'total_discounts', 'label' => 'Total (lines only)'],
            ],
            'month' => [
                ['key' => 'period', 'label' => 'Month'],
                ['key' => 'branch', 'label' => 'Branch'],
                ['key' => 'line_discounts', 'label' => 'Line discounts'],
                ['key' => 'invoice_discounts', 'label' => 'Invoice discounts'],
                ['key' => 'total_discounts', 'label' => 'Total'],
            ],
            default => [
                ['key' => 'branch', 'label' => 'Branch'],
                ['key' => 'line_discounts', 'label' => 'Line discounts'],
                ['key' => 'invoice_discounts', 'label' => 'Invoice discounts'],
                ['key' => 'total_discounts', 'label' => 'Total'],
            ],
        };

        $saleMonth = $this->sqlMonthPeriod('s.sale_date');

        $lineBase = DB::table('sale_items as si')
            ->join('sales as s', 's.id', '=', 'si.sale_id')
            ->whereNull('si.deleted_at')
            ->whereNull('s.deleted_at')
            ->where('s.status', 'completed')
            ->when($request->query('date_from'), fn ($q, $v) => $q->whereDate('s.sale_date', '>=', $v))
            ->when($request->query('date_to'), fn ($q, $v) => $q->whereDate('s.sale_date', '<=', $v))
            ->when($request->query('branch_id'), fn ($q, $v) => $q->where('s.branch_id', (int) $v));

        $invBase = DB::table('sales as s')
            ->whereNull('s.deleted_at')
            ->where('s.status', 'completed')
            ->when($request->query('date_from'), fn ($q, $v) => $q->whereDate('s.sale_date', '>=', $v))
            ->when($request->query('date_to'), fn ($q, $v) => $q->whereDate('s.sale_date', '<=', $v))
            ->when($request->query('branch_id'), fn ($q, $v) => $q->where('s.branch_id', (int) $v));

        $rows = [];

        if ($slice === 'branch') {
            $lineAgg = (clone $lineBase)
                ->groupBy('s.branch_id')
                ->select(['s.branch_id as slice_key', DB::raw('SUM(si.discount) as line_discount')]);
            $invAgg = (clone $invBase)
                ->groupBy('s.branch_id')
                ->select(['s.branch_id as slice_key', DB::raw('SUM(s.discount_amount) as invoice_discount')]);
            $lineMap = collect($lineAgg->get())->keyBy('slice_key');
            $invMap = collect($invAgg->get())->keyBy('slice_key');
            $branchNames = Branch::query()->whereIn('id', $lineMap->keys()->merge($invMap->keys())->unique()->filter())->pluck('name', 'id');
            foreach ($lineMap->keys()->merge($invMap->keys())->unique() as $bid) {
                $line = (float) ($lineMap[$bid]->line_discount ?? 0);
                $inv = (float) ($invMap[$bid]->invoice_discount ?? 0);
                $rows[] = [
                    'branch' => (string) ($branchNames[$bid] ?? '—'),
                    'line_discounts' => number_format($line, 2, '.', ''),
                    'invoice_discounts' => number_format($inv, 2, '.', ''),
                    'total_discounts' => number_format($line + $inv, 2, '.', ''),
                    '_sort' => $line + $inv,
                ];
            }
        } elseif ($slice === 'cashier') {
            $lineAgg = (clone $lineBase)
                ->groupBy(DB::raw('COALESCE(s.created_by, 0)'))
                ->select([DB::raw('COALESCE(s.created_by, 0) as slice_key'), DB::raw('SUM(si.discount) as line_discount')]);
            $invAgg = (clone $invBase)
                ->groupBy(DB::raw('COALESCE(s.created_by, 0)'))
                ->select([DB::raw('COALESCE(s.created_by, 0) as slice_key'), DB::raw('SUM(s.discount_amount) as invoice_discount')]);
            $lineMap = collect($lineAgg->get())->keyBy('slice_key');
            $invMap = collect($invAgg->get())->keyBy('slice_key');
            $userIds = $lineMap->keys()->merge($invMap->keys())->unique()->filter(fn ($id) => (int) $id > 0)->all();
            $users = User::query()->with('employee:id,user_id,name')->whereIn('id', $userIds)->get()->keyBy('id');
            foreach ($lineMap->keys()->merge($invMap->keys())->unique() as $uid) {
                $line = (float) ($lineMap[$uid]->line_discount ?? 0);
                $inv = (float) ($invMap[$uid]->invoice_discount ?? 0);
                $label = (int) $uid === 0 ? '—' : (($u = $users->get((int) $uid)) ? $u->displayName() : '—');
                $rows[] = [
                    'cashier' => $label,
                    'line_discounts' => number_format($line, 2, '.', ''),
                    'invoice_discounts' => number_format($inv, 2, '.', ''),
                    'total_discounts' => number_format($line + $inv, 2, '.', ''),
                    '_sort' => $line + $inv,
                ];
            }
        } elseif ($slice === 'product') {
            $lineAgg = (clone $lineBase)
                ->join('products as p', 'p.id', '=', 'si.product_id')
                ->groupBy('si.product_id', 'p.name')
                ->select(['si.product_id as slice_key', 'p.name as product_name', DB::raw('SUM(si.discount) as line_discount')])
                ->orderByDesc(DB::raw('SUM(si.discount)'));
            foreach ($lineAgg->get() as $r) {
                $line = (float) $r->line_discount;
                $rows[] = [
                    'product' => (string) $r->product_name,
                    'line_discounts' => number_format($line, 2, '.', ''),
                    'invoice_discounts' => '—',
                    'total_discounts' => number_format($line, 2, '.', ''),
                    '_sort' => $line,
                ];
            }
        } else {
            $lineAgg = (clone $lineBase)
                ->join('branches as b', 'b.id', '=', 's.branch_id')
                ->groupBy(DB::raw($saleMonth), 's.branch_id', 'b.name')
                ->select([
                    DB::raw($saleMonth.' as period'),
                    's.branch_id',
                    'b.name as branch_name',
                    DB::raw('SUM(si.discount) as line_discount'),
                ]);
            $invAgg = (clone $invBase)
                ->join('branches as b', 'b.id', '=', 's.branch_id')
                ->groupBy(DB::raw($saleMonth), 's.branch_id', 'b.name')
                ->select([
                    DB::raw($saleMonth.' as period'),
                    's.branch_id',
                    'b.name as branch_name',
                    DB::raw('SUM(s.discount_amount) as invoice_discount'),
                ]);
            $keyFn = static fn (string $period, int $branchId): string => $period.'|'.$branchId;
            $lineMap = [];
            foreach ($lineAgg->get() as $row) {
                $lineMap[$keyFn((string) $row->period, (int) $row->branch_id)] = $row;
            }
            $invMap = [];
            foreach ($invAgg->get() as $row) {
                $invMap[$keyFn((string) $row->period, (int) $row->branch_id)] = $row;
            }
            foreach (collect(array_merge(array_keys($lineMap), array_keys($invMap)))
                ->unique()
                ->sort(static function (string $a, string $b): int {
                    [$pa, $ba] = explode('|', $a, 2);
                    [$pb, $bb] = explode('|', $b, 2);
                    $c = strcmp($pb, $pa);

                    return $c !== 0 ? $c : strcmp((string) $ba, (string) $bb);
                })
                ->values()
                ->all() as $key) {
                [$period] = explode('|', $key, 2);
                $lr = $lineMap[$key] ?? null;
                $ir = $invMap[$key] ?? null;
                $line = (float) ($lr->line_discount ?? 0);
                $inv = (float) ($ir->invoice_discount ?? 0);
                $rows[] = [
                    'period' => $period,
                    'branch' => (string) ($lr->branch_name ?? $ir->branch_name ?? '—'),
                    'line_discounts' => number_format($line, 2, '.', ''),
                    'invoice_discounts' => number_format($inv, 2, '.', ''),
                    'total_discounts' => number_format($line + $inv, 2, '.', ''),
                ];
            }
        }

        if ($slice !== 'month') {
            usort($rows, static fn (array $a, array $b): int => ($b['_sort'] ?? 0) <=> ($a['_sort'] ?? 0));
        }
        $rows = array_map(static function (array $r): array {
            unset($r['_sort']);

            return $r;
        }, $rows);

        return $this->manualTablePayload(
            'Discount analysis (completed sales)',
            $columns,
            $rows,
            $request,
            $paginate,
            $n,
            [
                'branches' => Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
                'slice_options' => [
                    ['value' => 'branch', 'label' => 'By branch'],
                    ['value' => 'cashier', 'label' => 'By cashier'],
                    ['value' => 'product', 'label' => 'By product (lines only)'],
                    ['value' => 'month', 'label' => 'By month & branch'],
                ],
            ]
        );
    }

    private function returnsAnalysis(Request $request, bool $paginate, int $n): array
    {
        $slice = strtolower((string) $request->query('slice', 'branch'));
        if (! in_array($slice, ['branch', 'cashier', 'product', 'month'], true)) {
            $slice = 'branch';
        }

        $columns = match ($slice) {
            'cashier' => [
                ['key' => 'cashier', 'label' => 'User'],
                ['key' => 'returns_count', 'label' => 'Returns'],
                ['key' => 'lines_subtotal', 'label' => 'Lines subtotal'],
                ['key' => 'tax_amount', 'label' => 'Tax'],
                ['key' => 'total', 'label' => 'Total'],
                ['key' => 'refund_amount', 'label' => 'Refunded'],
            ],
            'product' => [
                ['key' => 'product', 'label' => 'Product'],
                ['key' => 'returns_count', 'label' => 'Returns'],
                ['key' => 'qty_returned', 'label' => 'Qty returned'],
                ['key' => 'lines_subtotal', 'label' => 'Lines subtotal'],
            ],
            'month' => [
                ['key' => 'period', 'label' => 'Month'],
                ['key' => 'branch', 'label' => 'Branch'],
                ['key' => 'returns_count', 'label' => 'Returns'],
                ['key' => 'lines_subtotal', 'label' => 'Subtotal'],
                ['key' => 'tax_amount', 'label' => 'Tax'],
                ['key' => 'total', 'label' => 'Total'],
                ['key' => 'refund_amount', 'label' => 'Refunded'],
            ],
            default => [
                ['key' => 'branch', 'label' => 'Branch'],
                ['key' => 'returns_count', 'label' => 'Returns'],
                ['key' => 'lines_subtotal', 'label' => 'Subtotal'],
                ['key' => 'tax_amount', 'label' => 'Tax'],
                ['key' => 'total', 'label' => 'Total'],
                ['key' => 'refund_amount', 'label' => 'Refunded'],
            ],
        };

        $retBase = DB::table('sale_returns as sr')
            ->join('warehouses as w', 'w.id', '=', 'sr.warehouse_id')
            ->where('sr.status', 'completed')
            ->when($request->query('date_from'), fn ($q, $v) => $q->whereDate('sr.return_date', '>=', $v))
            ->when($request->query('date_to'), fn ($q, $v) => $q->whereDate('sr.return_date', '<=', $v))
            ->when($request->query('branch_id'), fn ($q, $v) => $q->where('w.branch_id', (int) $v))
            ->when($request->query('warehouse_id'), fn ($q, $v) => $q->where('sr.warehouse_id', (int) $v));

        $rows = [];

        if ($slice === 'branch') {
            $agg = (clone $retBase)
                ->join('branches as b', 'b.id', '=', 'w.branch_id')
                ->groupBy('w.branch_id', 'b.name')
                ->orderByDesc(DB::raw('SUM(sr.total)'))
                ->select([
                    'w.branch_id as slice_key',
                    'b.name as branch_name',
                    DB::raw('COUNT(sr.id) as returns_count'),
                    DB::raw('SUM(sr.subtotal) as lines_subtotal'),
                    DB::raw('SUM(sr.tax_amount) as tax_amount'),
                    DB::raw('SUM(sr.total) as total'),
                    DB::raw('SUM(sr.refund_amount) as refund_amount'),
                ]);
            foreach ($agg->get() as $r) {
                $rows[] = [
                    'branch' => (string) $r->branch_name,
                    'returns_count' => (string) $r->returns_count,
                    'lines_subtotal' => number_format((float) $r->lines_subtotal, 2, '.', ''),
                    'tax_amount' => number_format((float) $r->tax_amount, 2, '.', ''),
                    'total' => number_format((float) $r->total, 2, '.', ''),
                    'refund_amount' => number_format((float) $r->refund_amount, 2, '.', ''),
                ];
            }
        } elseif ($slice === 'cashier') {
            $agg = (clone $retBase)
                ->groupBy(DB::raw('COALESCE(sr.created_by, 0)'))
                ->select([
                    DB::raw('COALESCE(sr.created_by, 0) as slice_key'),
                    DB::raw('COUNT(sr.id) as returns_count'),
                    DB::raw('SUM(sr.subtotal) as lines_subtotal'),
                    DB::raw('SUM(sr.tax_amount) as tax_amount'),
                    DB::raw('SUM(sr.total) as total'),
                    DB::raw('SUM(sr.refund_amount) as refund_amount'),
                ]);
            $lineMap = collect($agg->get())->keyBy('slice_key');
            $userIds = $lineMap->keys()->filter(fn ($id) => (int) $id > 0)->all();
            $users = User::query()->with('employee:id,user_id,name')->whereIn('id', $userIds)->get()->keyBy('id');
            foreach ($lineMap->sortByDesc('total')->values()->all() as $r) {
                $uid = (int) $r->slice_key;
                $label = $uid === 0 ? '—' : (($u = $users->get($uid)) ? $u->displayName() : '—');
                $rows[] = [
                    'cashier' => $label,
                    'returns_count' => (string) $r->returns_count,
                    'lines_subtotal' => number_format((float) $r->lines_subtotal, 2, '.', ''),
                    'tax_amount' => number_format((float) $r->tax_amount, 2, '.', ''),
                    'total' => number_format((float) $r->total, 2, '.', ''),
                    'refund_amount' => number_format((float) $r->refund_amount, 2, '.', ''),
                ];
            }
        } elseif ($slice === 'product') {
            $agg = DB::table('sale_return_items as sri')
                ->join('sale_returns as sr', 'sr.id', '=', 'sri.sale_return_id')
                ->join('products as p', 'p.id', '=', 'sri.product_id')
                ->join('warehouses as w', 'w.id', '=', 'sr.warehouse_id')
                ->where('sr.status', 'completed')
                ->when($request->query('date_from'), fn ($q, $v) => $q->whereDate('sr.return_date', '>=', $v))
                ->when($request->query('date_to'), fn ($q, $v) => $q->whereDate('sr.return_date', '<=', $v))
                ->when($request->query('branch_id'), fn ($q, $v) => $q->where('w.branch_id', (int) $v))
                ->when($request->query('warehouse_id'), fn ($q, $v) => $q->where('sr.warehouse_id', (int) $v))
                ->groupBy('sri.product_id', 'p.name')
                ->select([
                    'p.name as product_name',
                    DB::raw('COUNT(DISTINCT sr.id) as returns_count'),
                    DB::raw('SUM(sri.quantity) as qty_returned'),
                    DB::raw('SUM(sri.subtotal) as lines_subtotal'),
                ])
                ->orderByDesc(DB::raw('SUM(sri.subtotal)'));
            foreach ($agg->get() as $r) {
                $rows[] = [
                    'product' => (string) $r->product_name,
                    'returns_count' => (string) $r->returns_count,
                    'qty_returned' => $this->formatReportQty($r->qty_returned ?? 0),
                    'lines_subtotal' => number_format((float) $r->lines_subtotal, 2, '.', ''),
                ];
            }
        } else {
            $retMonth = $this->sqlMonthPeriod('sr.return_date');
            $agg = (clone $retBase)
                ->join('branches as b', 'b.id', '=', 'w.branch_id')
                ->groupBy(DB::raw($retMonth), 'w.branch_id', 'b.name')
                ->select([
                    DB::raw($retMonth.' as period'),
                    'w.branch_id',
                    'b.name as branch_name',
                    DB::raw('COUNT(sr.id) as returns_count'),
                    DB::raw('SUM(sr.subtotal) as lines_subtotal'),
                    DB::raw('SUM(sr.tax_amount) as tax_amount'),
                    DB::raw('SUM(sr.total) as total'),
                    DB::raw('SUM(sr.refund_amount) as refund_amount'),
                ])
                ->orderByDesc(DB::raw($retMonth))
                ->orderBy('b.name');
            foreach ($agg->get() as $r) {
                $rows[] = [
                    'period' => (string) $r->period,
                    'branch' => (string) $r->branch_name,
                    'returns_count' => (string) $r->returns_count,
                    'lines_subtotal' => number_format((float) $r->lines_subtotal, 2, '.', ''),
                    'tax_amount' => number_format((float) $r->tax_amount, 2, '.', ''),
                    'total' => number_format((float) $r->total, 2, '.', ''),
                    'refund_amount' => number_format((float) $r->refund_amount, 2, '.', ''),
                ];
            }
        }

        return $this->manualTablePayload(
            'Returns analysis (completed returns)',
            $columns,
            $rows,
            $request,
            $paginate,
            $n,
            [
                'branches' => Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
                'warehouses' => Warehouse::query()->where('status', 'active')->orderBy('name')->get(['id', 'name', 'branch_id']),
                'slice_options' => [
                    ['value' => 'branch', 'label' => 'By branch'],
                    ['value' => 'cashier', 'label' => 'By user'],
                    ['value' => 'product', 'label' => 'By product'],
                    ['value' => 'month', 'label' => 'By month & branch'],
                ],
            ]
        );
    }

    private function expenseVsSales(Request $request, bool $paginate, int $n): array
    {
        $columns = [
            ['key' => 'period', 'label' => 'Month'],
            ['key' => 'branch', 'label' => 'Branch'],
            ['key' => 'sales_total', 'label' => 'Sales (invoice total)'],
            ['key' => 'expenses_total', 'label' => 'Expenses'],
            ['key' => 'expense_ratio_pct', 'label' => 'Expense / sales %'],
            ['key' => 'sales_less_expenses', 'label' => 'Sales − expenses'],
        ];

        $saleMonth = $this->sqlMonthPeriod('s.sale_date');
        $salesRows = DB::table('sales as s')
            ->join('branches as b', 'b.id', '=', 's.branch_id')
            ->whereNull('s.deleted_at')
            ->where('s.status', 'completed')
            ->when($request->query('date_from'), fn ($q, $v) => $q->whereDate('s.sale_date', '>=', $v))
            ->when($request->query('date_to'), fn ($q, $v) => $q->whereDate('s.sale_date', '<=', $v))
            ->when($request->query('branch_id'), fn ($q, $v) => $q->where('s.branch_id', (int) $v))
            ->groupBy(DB::raw($saleMonth), 's.branch_id', 'b.name')
            ->select([
                DB::raw($saleMonth.' as period'),
                's.branch_id',
                'b.name as branch_name',
                DB::raw('SUM(s.total) as sales_total'),
            ])
            ->get();

        $expMonth = $this->sqlMonthPeriod('e.expense_date');
        $expRows = DB::table('expenses as e')
            ->join('branches as b', 'b.id', '=', 'e.branch_id')
            ->whereNull('e.deleted_at')
            ->when($request->query('date_from'), fn ($q, $v) => $q->whereDate('e.expense_date', '>=', $v))
            ->when($request->query('date_to'), fn ($q, $v) => $q->whereDate('e.expense_date', '<=', $v))
            ->when($request->query('branch_id'), fn ($q, $v) => $q->where('e.branch_id', (int) $v))
            ->groupBy(DB::raw($expMonth), 'e.branch_id', 'b.name')
            ->select([
                DB::raw($expMonth.' as period'),
                'e.branch_id',
                'b.name as branch_name',
                DB::raw('SUM(e.amount) as expenses_total'),
            ])
            ->get();

        $keyFn = static fn (string $period, int $branchId): string => $period.'|'.$branchId;
        $saleMap = [];
        foreach ($salesRows as $row) {
            $saleMap[$keyFn((string) $row->period, (int) $row->branch_id)] = $row;
        }
        $expMap = [];
        foreach ($expRows as $row) {
            $expMap[$keyFn((string) $row->period, (int) $row->branch_id)] = $row;
        }

        $keys = collect(array_merge(array_keys($saleMap), array_keys($expMap)))
            ->unique()
            ->sort(static function (string $a, string $b): int {
                [$pa, $ba] = explode('|', $a, 2);
                [$pb, $bb] = explode('|', $b, 2);
                $c = strcmp($pb, $pa);

                return $c !== 0 ? $c : strcmp((string) $ba, (string) $bb);
            })
            ->values()
            ->all();

        $rows = [];
        foreach ($keys as $key) {
            [$period] = explode('|', $key, 2);
            $sr = $saleMap[$key] ?? null;
            $er = $expMap[$key] ?? null;
            $branchName = $sr->branch_name ?? $er->branch_name ?? '—';
            $st = (float) ($sr->sales_total ?? 0);
            $ex = (float) ($er->expenses_total ?? 0);
            $ratio = $st > 0 ? round($ex / $st * 100, 2) : null;

            $rows[] = [
                'period' => $period,
                'branch' => $branchName,
                'sales_total' => number_format($st, 2, '.', ''),
                'expenses_total' => number_format($ex, 2, '.', ''),
                'expense_ratio_pct' => $ratio !== null ? number_format($ratio, 2, '.', '') : '—',
                'sales_less_expenses' => number_format(round($st - $ex, 2), 2, '.', ''),
            ];
        }

        return $this->manualTablePayload(
            'Expense vs sales (by month & branch)',
            $columns,
            $rows,
            $request,
            $paginate,
            $n,
            [
                'branches' => Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
                'report_notes' => [
                    'Sales use completed invoice totals; expenses use recorded expense amounts for the same calendar month.',
                ],
            ]
        );
    }

    /**
     * YYYY-MM grouping for aggregate reports (SQLite vs MySQL).
     */
    private function sqlMonthPeriod(string $qualifiedColumn): string
    {
        return match (DB::connection()->getDriverName()) {
            'sqlite' => "strftime('%Y-%m', {$qualifiedColumn})",
            default => "DATE_FORMAT({$qualifiedColumn}, '%Y-%m')",
        };
    }

    /**
     * @param  array<string, float>  $avgMap
     */
    private function resolveSaleLineUnitCost(SaleItem $line, array $avgMap, string $costBasis): float
    {
        $variantId = $line->product_variant_id;
        $pk = $line->product_id.'|'.($variantId !== null ? (string) $variantId : '0');
        $pOnly = $line->product_id.'|0';
        $avgPurchase = (float) ($avgMap[$pk] ?? $avgMap[$pOnly] ?? 0);

        if ($costBasis === 'avg_purchase_only') {
            return $avgPurchase;
        }

        if (
            $variantId
            && $line->relationLoaded('productVarient')
            && $line->productVarient
            && $line->productVarient->cost_price !== null
            && (float) $line->productVarient->cost_price > 0
        ) {
            return (float) $line->productVarient->cost_price;
        }

        return $avgPurchase;
    }

    /**
     * @param  list<array<string, string|null>>  $rows
     * @return array{columns: list<array{key: string, label: string}>, paginator?: LengthAwarePaginator<int, array<string, string|null>>, rows?: list<array<string, string|null>>, filterOptions: array<string, mixed>, title: string}
     */
    private function manualTablePayload(string $title, array $columns, array $rows, Request $request, bool $paginate, int $perPageOrLimit, array $filterOptions): array
    {
        if ($paginate) {
            $page = max(1, (int) $request->query('page', 1));
            $total = count($rows);
            $slice = array_slice($rows, ($page - 1) * $perPageOrLimit, $perPageOrLimit);
            $paginator = new ConcretePaginator($slice, $total, $perPageOrLimit, $page, [
                'path' => $request->url(),
                'query' => $request->query(),
            ]);

            return [
                'title' => $title,
                'columns' => $columns,
                'paginator' => $paginator,
                'filterOptions' => $filterOptions,
            ];
        }

        return [
            'title' => $title,
            'columns' => $columns,
            'rows' => array_slice($rows, 0, $perPageOrLimit),
            'filterOptions' => $filterOptions,
        ];
    }

    /**
     * @return array<string, float>
     */
    private function averagePurchaseUnitCostMap(): array
    {
        $rows = DB::table('purchase_invoice_items as pii')
            ->join('purchase_invoices as pi', 'pi.id', '=', 'pii.purchase_invoice_id')
            ->whereNull('pi.deleted_at')
            ->whereNull('pii.deleted_at')
            ->whereNotIn('pi.status', ['draft', 'cancelled'])
            ->groupBy('pii.product_id', 'pii.product_variant_id')
            ->select([
                'pii.product_id',
                'pii.product_variant_id',
                DB::raw('AVG(pii.unit_cost) as avg_unit_cost'),
            ])
            ->get();

        $map = [];
        foreach ($rows as $row) {
            $vk = $row->product_variant_id !== null ? (string) $row->product_variant_id : '0';
            $map[$row->product_id.'|'.$vk] = (float) $row->avg_unit_cost;
        }

        return $map;
    }

    private function agingBucketLabel(int $daysOutstanding): string
    {
        return match (true) {
            $daysOutstanding <= 30 => '0–30 days',
            $daysOutstanding <= 60 => '31–60 days',
            $daysOutstanding <= 90 => '61–90 days',
            default => '90+ days',
        };
    }

    /**
     * Active suppliers for report filters (search by name or code).
     *
     * @return list<array{id: int, name: string, code: string|null, business_name: string|null}>
     */
    private function reportFilterSuppliers(int $limit = 500): array
    {
        return Supplier::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->limit($limit)
            ->get(['id', 'name', 'code', 'business_name'])
            ->map(static fn (Supplier $s): array => [
                'id' => $s->id,
                'name' => $s->name,
                'code' => $s->code,
                'business_name' => $s->business_name,
            ])
            ->all();
    }

    /**
     * Active products with variants for report filters (search by name or SKU).
     *
     * @return list<array{id: int, name: string, variants: list<array{id: int, sku: string|null, name: string, attribute_labels: list<array{attribute: string, value: string}>}>}>
     */
    private function reportFilterProducts(int $limit = 300): array
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
                    ])
                    ->limit(20),
            ])
            ->orderBy('name')
            ->limit($limit)
            ->get(['id', 'name'])
            ->map(static function (Product $p): array {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
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
            })
            ->all();
    }

    /**
     * @return list<int>
     */
    private function normalizeExportIds(Request $request): array
    {
        $raw = $request->query('ids', []);
        if (! is_array($raw)) {
            $raw = $raw !== null && $raw !== '' ? [$raw] : [];
        }

        return array_slice(
            array_values(array_unique(array_filter(array_map(static fn ($v): int => (int) $v, $raw)))),
            0,
            500
        );
    }

    /**
     * Human-readable qty: trim trailing zeros (9.0000 → 9, 1.5000 → 1.5).
     */
    private function formatReportQty(mixed $value): string
    {
        if ($value === null || $value === '') {
            return '0';
        }

        $f = (float) $value;
        if (! is_finite($f)) {
            return '0';
        }

        $s = rtrim(rtrim(number_format($f, 4, '.', ''), '0'), '.');

        return $s === '' || $s === '-0' ? '0' : $s;
    }
}
