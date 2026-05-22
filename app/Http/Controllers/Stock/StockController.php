<?php

namespace App\Http\Controllers\Stock;

use App\Http\Controllers\Controller;
use App\Models\Company\Branch;
use App\Models\Company\Warehouse;
use App\Models\Product\Product;
use App\Models\Product\ProductVarient;
use App\Models\Setting;
use App\Models\Stock;
use App\Services\LengthCutStockService;
use App\Support\LengthBillingPairs;
use Barryvdh\DomPDF\PDF;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StockController extends Controller
{
    private const EXPORT_FILTER_KEYS = ['q', 'status', 'branch_id', 'warehouse_id', 'product_id'];

    /**
     * One stock row per product + variant + warehouse (see stocks.stock_unique).
     */
    private function findExistingStockRow(int $productId, ?int $variantId, int $warehouseId, ?int $exceptStockId = null): ?Stock
    {
        $query = Stock::withTrashed()
            ->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId);

        if ($variantId !== null && $variantId > 0) {
            $query->where('product_variant_id', $variantId);
        } else {
            $query->whereNull('product_variant_id');
        }

        if ($exceptStockId !== null) {
            $query->where('id', '!=', $exceptStockId);
        }

        return $query->first();
    }

    private function attachLengthPairMetrics(Stock $stock): void
    {
        if (($stock->billing_mode ?? 'quantity') !== 'length_ft') {
            $stock->setAttribute('length_pairs_sum_ft', null);
            $stock->setAttribute('length_pairs_qty_matches_sum', null);

            return;
        }

        $raw = is_array($stock->length_pairs) ? $stock->length_pairs : [];
        $normalized = LengthBillingPairs::normalizeLengthPairsForStorage($raw);
        $sumFt = LengthBillingPairs::totalFeetFromLengthPairs($normalized);
        $stock->setAttribute('length_pairs_sum_ft', $sumFt);
        $qty = (float) $stock->quantity;
        $stock->setAttribute('length_pairs_qty_matches_sum', abs($sumFt - $qty) < 0.0001);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return Builder<Stock>
     */
    private function stockIndexFilteredQuery(array $filters): Builder
    {
        return Stock::query()
            ->with([
                'product:id,name,slug,quantity_alert',
                'productVarient:id,product_id,name,sku,selling_price',
                'warehouse:id,name,branch_id',
                'warehouse.branch:id,name',
            ])
            ->when($filters['q'] ?? null, function ($q, $v) {
                $q->whereHas('product', fn ($qq) => $qq->where('name', 'like', '%'.$v.'%'))
                    ->orWhereHas('productVarient', fn ($qq) => $qq->where('sku', 'like', '%'.$v.'%'));
            })
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['warehouse_id'] ?? null, fn ($q, $v) => $q->where('warehouse_id', $v))
            ->when($filters['product_id'] ?? null, fn ($q, $v) => $q->where('product_id', $v))
            ->when($filters['branch_id'] ?? null, function ($q, $v) {
                $q->whereHas('warehouse', fn ($qq) => $qq->where('branch_id', $v));
            });
    }

    /**
     * @return list<int>
     */
    private function normalizeExportStockIds(Request $request): array
    {
        $raw = $request->query('ids', []);
        if (! is_array($raw)) {
            $raw = $raw !== null && $raw !== '' ? [$raw] : [];
        }
        $ids = array_values(array_unique(array_filter(array_map(static fn ($v): int => (int) $v, $raw))));

        return array_slice($ids, 0, 500);
    }

    private function lengthPairsSummaryForExport(?array $pairs): string
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
     * @return array<string, string|int|float|null>
     */
    private function stockToExportRow(Stock $stock, int $globalLow): array
    {
        $this->attachLengthPairMetrics($stock);

        $threshold = $stock->product?->quantity_alert !== null
            ? (int) $stock->product->quantity_alert
            : $globalLow;
        $available = (float) $stock->quantity - (float) $stock->reserved_quantity;
        $isLow = $stock->status === 'active' && $available <= (float) $threshold;

        $variant = $stock->productVarient;
        $variantLabel = $variant
            ? (($variant->sku ? (string) $variant->sku.' — ' : '').(string) ($variant->name ?? ''))
            : '';

        $billing = (string) ($stock->billing_mode ?? 'quantity');
        $lengthSummary = $this->lengthPairsSummaryForExport(is_array($stock->length_pairs) ? $stock->length_pairs : []);

        $qtyUnits = $billing === 'length_ft' ? '' : (string) $stock->quantity;
        $actualFt = $billing === 'length_ft' ? (string) $stock->quantity : '';
        $sellingPrice = $this->resolveSellingPriceForExport($stock);
        $updated = $this->formatStockUpdatedForExport($stock);
        $warehouseName = $this->resolveWarehouseNameForExport($stock);
        $branchName = $this->resolveBranchNameForExport($stock);

        return [
            'id' => (int) $stock->id,
            'product_id' => (int) $stock->product_id,
            'product_name' => (string) ($stock->product?->name ?? ''),
            'warehouse_name' => $warehouseName,
            'branch_name' => $branchName,
            'product_slug' => (string) ($stock->product?->slug ?? ''),
            'variant_sku' => (string) ($variant?->sku ?? ''),
            'variant_name' => (string) ($variant?->name ?? ''),
            'variant_label' => $variantLabel,
            'selling_price' => $sellingPrice,
            'warehouse_id' => (int) $stock->warehouse_id,
            'branch_id' => (int) ($stock->warehouse?->branch_id ?? 0),
            'billing_mode' => $billing,
            'lengths_lxq' => $lengthSummary,
            'length_pairs_sum_ft' => $stock->length_pairs_sum_ft !== null ? (string) $stock->length_pairs_sum_ft : '',
            'quantity_on_hand' => (string) $stock->quantity,
            'qty_units' => $qtyUnits,
            'actual_ft_on_hand' => $actualFt,
            'reserved_quantity' => (string) $stock->reserved_quantity,
            'available_quantity' => (string) round($available, 4),
            'low_stock_threshold_used' => (string) $threshold,
            'is_low_stock' => $isLow ? 'yes' : 'no',
            'status' => (string) $stock->status,
            'stock_updated_at' => $updated['stock_updated_at'],
            'stock_updated_day' => $updated['stock_updated_day'],
        ];
    }

    /**
     * @return array{stock_updated_at: string, stock_updated_day: string}
     */
    private function formatStockUpdatedForExport(Stock $stock): array
    {
        $at = $stock->updated_at ?? $stock->created_at;
        if ($at === null) {
            return [
                'stock_updated_at' => '',
                'stock_updated_day' => '',
            ];
        }

        $dt = $at instanceof Carbon ? $at->copy() : Carbon::parse($at);

        return [
            'stock_updated_at' => $dt->format('Y-m-d H:i'),
            'stock_updated_day' => $dt->format('l'),
        ];
    }

    private function resolveSellingPriceForExport(Stock $stock): string
    {
        if ($stock->productVarient !== null) {
            return number_format((float) $stock->productVarient->selling_price, 2, '.', '');
        }

        if ($stock->product_id) {
            $raw = ProductVarient::query()
                ->where('product_id', $stock->product_id)
                ->orderBy('id')
                ->value('selling_price');
            if ($raw !== null) {
                return number_format((float) $raw, 2, '.', '');
            }
        }

        return '0.00';
    }

    private function resolveWarehouseNameForExport(Stock $stock): string
    {
        $name = $stock->warehouse?->name;
        if ($name !== null && $name !== '') {
            return (string) $name;
        }

        if ($stock->warehouse_id) {
            $fromDb = Warehouse::query()->whereKey($stock->warehouse_id)->value('name');
            if ($fromDb !== null && $fromDb !== '') {
                return (string) $fromDb;
            }
        }

        return '—';
    }

    private function resolveBranchNameForExport(Stock $stock): string
    {
        $name = $stock->warehouse?->branch?->name;
        if ($name !== null && $name !== '') {
            return (string) $name;
        }

        $branchId = $stock->warehouse?->branch_id;
        if ($branchId) {
            $fromDb = Branch::query()->whereKey($branchId)->value('name');
            if ($fromDb !== null && $fromDb !== '') {
                return (string) $fromDb;
            }
        }

        if ($stock->warehouse_id) {
            $branchIdFromWarehouse = Warehouse::query()
                ->whereKey($stock->warehouse_id)
                ->value('branch_id');
            if ($branchIdFromWarehouse) {
                $fromDb = Branch::query()->whereKey($branchIdFromWarehouse)->value('name');
                if ($fromDb !== null && $fromDb !== '') {
                    return (string) $fromDb;
                }
            }
        }

        return '—';
    }

    /**
     * @return Collection<int, Stock>
     */
    private function collectStocksForExport(Request $request): Collection
    {
        $filters = $request->only(self::EXPORT_FILTER_KEYS);
        $ids = $this->normalizeExportStockIds($request);
        $max = $ids !== [] ? 500 : 10000;

        $query = $this->stockIndexFilteredQuery($filters)->latest('id');
        if ($ids !== []) {
            $query->whereIn('id', $ids);
        }

        return $query->limit($max)->get();
    }

    /**
     * @return list<array{key: string, label: string}>
     */
    private function stockExportColumns(): array
    {
        return [
            ['key' => 'id', 'label' => 'Stock ID'],
            ['key' => 'product_id', 'label' => 'Product ID'],
            ['key' => 'product_name', 'label' => 'Product'],
            ['key' => 'warehouse_name', 'label' => 'Warehouse name'],
            ['key' => 'branch_name', 'label' => 'Branch name'],
            ['key' => 'product_slug', 'label' => 'Product slug'],
            ['key' => 'variant_sku', 'label' => 'Variant SKU'],
            ['key' => 'variant_name', 'label' => 'Variant name'],
            ['key' => 'variant_label', 'label' => 'Variant (SKU — name)'],
            ['key' => 'selling_price', 'label' => 'Selling price'],
            ['key' => 'billing_mode', 'label' => 'Billing mode'],
            ['key' => 'lengths_lxq', 'label' => 'Lengths (L×Q)'],
            ['key' => 'length_pairs_sum_ft', 'label' => 'Length rows Σ ft'],
            ['key' => 'quantity_on_hand', 'label' => 'Quantity (DB)'],
            ['key' => 'qty_units', 'label' => 'Qty (units)'],
            ['key' => 'actual_ft_on_hand', 'label' => 'Actual ft (on hand)'],
            ['key' => 'reserved_quantity', 'label' => 'Reserved'],
            ['key' => 'available_quantity', 'label' => 'Available'],
            ['key' => 'low_stock_threshold_used', 'label' => 'Low-stock threshold'],
            ['key' => 'is_low_stock', 'label' => 'Low stock?'],
            ['key' => 'status', 'label' => 'Status'],
            ['key' => 'stock_updated_at', 'label' => 'Stock last updated (date & time)'],
            ['key' => 'stock_updated_day', 'label' => 'Day'],
        ];
    }

    /**
     * Readable columns for PDF (warehouse name near product — fits landscape A4).
     *
     * @return list<array{key: string, label: string}>
     */
    private function stockExportPdfColumns(): array
    {
        return [
            ['key' => 'product_name', 'label' => 'Product'],
            ['key' => 'warehouse_name', 'label' => 'Warehouse name'],
            ['key' => 'branch_name', 'label' => 'Branch name'],
            ['key' => 'variant_label', 'label' => 'Variant'],
            ['key' => 'selling_price', 'label' => 'Selling price'],
            ['key' => 'lengths_lxq', 'label' => 'Lengths (L×Q)'],
            ['key' => 'qty_units', 'label' => 'Qty (units)'],
            ['key' => 'actual_ft_on_hand', 'label' => 'Actual ft (on hand)'],
            ['key' => 'reserved_quantity', 'label' => 'Reserved'],
            ['key' => 'available_quantity', 'label' => 'Available'],
            ['key' => 'status', 'label' => 'Status'],
            ['key' => 'stock_updated_at', 'label' => 'Stock last updated'],
            ['key' => 'stock_updated_day', 'label' => 'Day'],
        ];
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $globalLow = Setting::lowStockThreshold();
        $stocks = $this->collectStocksForExport($request);
        $columns = $this->stockExportColumns();
        $rows = $stocks->map(fn (Stock $s): array => $this->stockToExportRow($s, $globalLow))->all();

        $datePart = now()->format('Y-m-d');
        $filename = 'stock-export-'.$datePart.'.csv';

        return response()->streamDownload(function () use ($columns, $rows): void {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, array_map(static fn (array $c): string => $c['label'], $columns));
            foreach ($rows as $row) {
                $line = [];
                foreach ($columns as $col) {
                    $v = $row[$col['key']] ?? '';
                    $line[] = is_scalar($v) || $v === null ? (string) $v : '';
                }
                fputcsv($out, $line);
            }
            fclose($out);
        }, $filename, [
            // Prefer download; octet-stream avoids inline CSV preview in some browsers.
            'Content-Type' => 'application/octet-stream',
        ]);
    }

    public function exportPdf(Request $request): Response
    {
        $globalLow = Setting::lowStockThreshold();
        $stocks = $this->collectStocksForExport($request);
        $columns = $this->stockExportPdfColumns();
        $rows = $stocks->map(fn (Stock $s): array => $this->stockToExportRow($s, $globalLow))->all();

        $title = 'Stock export';
        $datePart = now()->format('Y-m-d');
        $pdfFilename = 'stock-export-'.$datePart.'.pdf';

        $pdfRows = [];
        foreach ($rows as $row) {
            $flat = [];
            foreach ($columns as $col) {
                $v = $row[$col['key']] ?? '';
                $flat[$col['key']] = is_scalar($v) || $v === null ? (string) $v : '';
            }
            $pdfRows[] = $flat;
        }

        try {
            /** @var PDF $generator */
            $generator = app()->make('dompdf.wrapper');
            $pdf = $generator
                ->loadView('reports.pdf-table', [
                    'title' => $title,
                    'columns' => $columns,
                    'rows' => $pdfRows,
                    'generatedAt' => now()->toDateTimeString(),
                ])
                ->setPaper('a4', 'landscape');

            // Always attachment so the file downloads instead of opening in the same tab (esp. local).
            return $pdf->download($pdfFilename);
        } catch (\Throwable $e) {
            report($e);

            $params = collect($request->only(self::EXPORT_FILTER_KEYS))
                ->filter(static fn ($v) => $v !== null && $v !== '')
                ->all();
            $url = route('stocks.index');
            if ($params !== []) {
                $url .= '?'.http_build_query($params);
            }

            return redirect()
                ->to($url)
                ->with(
                    'error',
                    'PDF export failed. Try CSV export, or ensure dompdf is installed and PHP has the dom extension enabled.'
                );
        }
    }

    public function index(Request $request)
    {
        $filters = $request->only([
            'q',
            'status',
            'branch_id',
            'warehouse_id',
            'product_id',
        ]);

        $globalLow = Setting::lowStockThreshold();

        $stocks = $this->stockIndexFilteredQuery($filters)
            ->latest('id')
            ->paginate(15)
            ->through(function (Stock $stock) use ($globalLow): Stock {
                $threshold = $stock->product?->quantity_alert !== null
                    ? (int) $stock->product->quantity_alert
                    : $globalLow;
                $available = (float) $stock->quantity - (float) $stock->reserved_quantity;
                $stock->setAttribute('low_stock_threshold_used', $threshold);
                $stock->setAttribute('available_quantity', $available);
                $stock->setAttribute(
                    'is_low_stock',
                    $stock->status === 'active' && $available <= (float) $threshold,
                );

                $this->attachLengthPairMetrics($stock);

                return $stock;
            })
            ->withQueryString();

        $branches = Branch::query()->where('status', 'active')->get(['id', 'name']);
        $warehouses = Warehouse::query()->where('status', 'active')->get(['id', 'name', 'branch_id']);
        return Inertia::render('Stock/Index', [
            'stocks' => $stocks,
            'filters' => $filters,
            'branches' => $branches,
            'warehouses' => $warehouses,
            'products' => $this->stockFormProducts(),
            'low_stock_threshold_default' => $globalLow,
        ]);
    }

    public function create()
    {
        $branches = Branch::query()->where('status', 'active')->get(['id', 'name']);
        $warehouses = Warehouse::query()->where('status', 'active')->get(['id', 'name', 'branch_id']);

        return Inertia::render('Stock/Create', [
            'branches' => $branches,
            'warehouses' => $warehouses,
            'products' => $this->stockFormProducts(),
        ]);
    }

    public function store(Request $request, LengthCutStockService $lengthCutStockService)
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'product_variant_id' => ['nullable', 'integer', 'exists:product_varients,id'],
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'billing_mode' => ['nullable', Rule::in(['quantity', 'length_ft'])],
            'length_pairs' => ['nullable', 'array'],
            'length_pairs.*.length' => ['nullable', 'numeric', 'min:0'],
            'length_pairs.*.qty' => ['nullable', 'numeric', 'min:0'],
            'quantity' => ['nullable', 'numeric', 'min:0'],
            'reserved_quantity' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $mode = ($data['billing_mode'] ?? 'quantity') === 'length_ft' ? 'length_ft' : 'quantity';

        if ($mode === 'length_ft') {
            $pairsRaw = is_array($request->input('length_pairs')) ? $request->input('length_pairs') : [];
            $normalizedPairs = LengthBillingPairs::normalizeLengthPairsForStorage($pairsRaw);
            $totalFt = LengthBillingPairs::totalFeetFromLengthPairs($normalizedPairs);
            if ($totalFt <= 0) {
                return redirect()
                    ->back()
                    ->withInput()
                    ->with('error', 'Length stock: total feet must be greater than zero (check length × qty rows).');
            }
            $data['billing_mode'] = 'length_ft';
            $data['length_pairs'] = $normalizedPairs;
            $data['quantity'] = $totalFt;
        } else {
            $data['billing_mode'] = 'quantity';
            $data['length_pairs'] = null;
            $data['quantity'] = $data['quantity'] ?? 0;
        }

        $data['reserved_quantity'] = $data['reserved_quantity'] ?? 0;

        $variantId = isset($data['product_variant_id']) && (int) $data['product_variant_id'] > 0
            ? (int) $data['product_variant_id']
            : null;
        if ($variantId === null) {
            $data['product_variant_id'] = null;
        }

        $existing = $this->findExistingStockRow(
            (int) $data['product_id'],
            $variantId,
            (int) $data['warehouse_id'],
        );

        if ($existing !== null && ! $existing->trashed()) {
            $productName = Product::query()->whereKey($data['product_id'])->value('name') ?? 'this product';
            $warehouseName = Warehouse::query()->whereKey($data['warehouse_id'])->value('name') ?? 'this warehouse';

            session()->flash('existing_stock_id', $existing->id);

            throw ValidationException::withMessages([
                'warehouse_id' => "Stock for {$productName} in {$warehouseName} already exists. Edit that row to change quantity or length rows — you cannot create a second row for the same product, variant, and warehouse.",
            ])->redirectTo(route('stocks.create'));
        }

        $restoringDeletedRow = $existing !== null && $existing->trashed();

        $stock = DB::transaction(function () use ($data, $existing, $restoringDeletedRow, $lengthCutStockService): Stock {
            if ($restoringDeletedRow && $existing !== null) {
                $existing->restore();
                $existing->update($data);
                $stock = $existing->fresh();
            } else {
                $stock = Stock::query()->create($data);
            }

            if (($stock->billing_mode ?? '') === 'length_ft') {
                $lengthCutStockService->syncLengthItemsFromStockLengthPairs($stock);
            }

            return $stock;
        });

        $message = $restoringDeletedRow
            ? 'Previously removed stock row restored and updated.'
            : 'Stock created.';

        return redirect()->route('stocks.show', $stock)->with('success', $message);
    }

    public function show(Stock $stock)
    {
        $stock->load([
            'product:id,name,slug',
            'productVarient:id,product_id,name,sku',
            'warehouse:id,name,branch_id',
            'warehouse.branch:id,name',
            'stockLengthItems' => fn ($q) => $q->where('status', 'available')->orderBy('length')->orderBy('id'),
        ]);

        $this->attachLengthPairMetrics($stock);

        return Inertia::render('Stock/Show', [
            'stock' => $stock,
        ]);
    }

    public function edit(Stock $stock)
    {
        $stock->load([
            'product:id,name',
            'productVarient:id,product_id,name,sku',
            'warehouse:id,name,branch_id',
        ]);

        $branches = Branch::query()->where('status', 'active')->get(['id', 'name']);
        $warehouses = Warehouse::query()->where('status', 'active')->get(['id', 'name', 'branch_id']);

        return Inertia::render('Stock/Edit', [
            'stock' => $stock,
            'branches' => $branches,
            'warehouses' => $warehouses,
            'products' => $this->stockFormProducts(),
        ]);
    }

    public function update(Request $request, Stock $stock, LengthCutStockService $lengthCutStockService)
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'product_variant_id' => ['nullable', 'integer', 'exists:product_varients,id'],
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'billing_mode' => ['nullable', Rule::in(['quantity', 'length_ft'])],
            'length_pairs' => ['nullable', 'array'],
            'length_pairs.*.length' => ['nullable', 'numeric', 'min:0'],
            'length_pairs.*.qty' => ['nullable', 'numeric', 'min:0'],
            'quantity' => ['nullable', 'numeric', 'min:0'],
            'reserved_quantity' => ['required', 'numeric', 'min:0'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $mode = ($data['billing_mode'] ?? 'quantity') === 'length_ft' ? 'length_ft' : 'quantity';

        if ($mode === 'length_ft') {
            $pairsRaw = is_array($request->input('length_pairs')) ? $request->input('length_pairs') : [];
            $normalizedPairs = LengthBillingPairs::normalizeLengthPairsForStorage($pairsRaw);
            $totalFt = LengthBillingPairs::totalFeetFromLengthPairs($normalizedPairs);
            if ($totalFt <= 0) {
                return redirect()
                    ->back()
                    ->withInput()
                    ->with('error', 'Length stock: total feet must be greater than zero (check length × qty rows).');
            }
            $data['billing_mode'] = 'length_ft';
            $data['length_pairs'] = $normalizedPairs;
            $data['quantity'] = $totalFt;
        } else {
            $data['billing_mode'] = 'quantity';
            $data['length_pairs'] = null;
            $data['quantity'] = $data['quantity'] ?? 0;
        }

        $variantId = isset($data['product_variant_id']) && (int) $data['product_variant_id'] > 0
            ? (int) $data['product_variant_id']
            : null;
        if ($variantId === null) {
            $data['product_variant_id'] = null;
        }

        $duplicate = $this->findExistingStockRow(
            (int) $data['product_id'],
            $variantId,
            (int) $data['warehouse_id'],
            (int) $stock->id,
        );

        if ($duplicate !== null) {
            throw ValidationException::withMessages([
                'warehouse_id' => 'Another stock row already uses this product, variant, and warehouse combination.',
            ])->redirectTo(route('stocks.edit', $stock));
        }

        DB::transaction(function () use ($stock, $data, $lengthCutStockService): void {
            $stock->update($data);
            $lengthCutStockService->syncLengthItemsFromStockLengthPairs($stock->fresh());
        });

        return redirect()->route('stocks.show', $stock)->with('success', 'Stock updated.');
    }

    public function destroy(Stock $stock)
    {
        $stock->delete();

        return redirect()->route('stocks.index')->with('success', 'Stock deleted.');
    }

    /**
     * Products with active variants for stock create/edit (search by name or variant SKU).
     *
     * @return list<array{id: int, name: string, variants: list<array{id: int, product_id: int, name: string, sku: string|null}>}>
     */
    private function stockFormProducts(): array
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
            ->get(['id', 'name'])
            ->map(static function (Product $p): array {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
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
}
