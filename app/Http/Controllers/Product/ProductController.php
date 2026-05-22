<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\ImportProductRequest;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Models\Product\Attribute;
use App\Models\Product\AttributeValue;
use App\Models\Product\Brand;
use App\Models\Product\Category;
use App\Models\Product\Product;
use App\Models\Product\ProductVarient;
use App\Models\Product\ProductVarientAttribute;
use App\Models\Product\SubCategory;
use App\Models\Product\Taxes;
use App\Models\Product\Unit;
use App\Models\Setting;
use App\Services\Product\ProductBarcodeGenerator;
use App\Services\Product\ProductBarcodeRenderer;
use App\Services\Product\ProductCsvImporter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProductController extends Controller
{
    use AuthorizesRequests;

    public function __construct()
    {
        $this->authorizeResource(Product::class, 'product', [
            'except' => ['pos', 'getProductByBarcode'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        return [
            'categories' => Category::query()
                ->orderBy('name')
                ->get(['id', 'name', 'slug'])
                ->map(fn (Category $c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'slug' => $c->slug,
                ]),
            'subCategories' => SubCategory::query()
                ->orderBy('name')
                ->get(['id', 'category_id', 'name', 'slug'])
                ->map(fn (SubCategory $s) => [
                    'id' => $s->id,
                    'category_id' => $s->category_id,
                    'name' => $s->name,
                    'slug' => $s->slug,
                ]),
            'brands' => Brand::query()
                ->orderBy('name')
                ->get(['id', 'name', 'slug'])
                ->map(fn (Brand $b) => [
                    'id' => $b->id,
                    'name' => $b->name,
                    'slug' => $b->slug,
                ]),
            'units' => Unit::query()
                ->orderBy('name')
                ->get(['id', 'name', 'symbol', 'slug'])
                ->map(fn (Unit $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'symbol' => $u->symbol,
                    'slug' => $u->slug,
                ]),
            'taxes' => Taxes::query()
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'slug'])
                ->map(fn (Taxes $t) => [
                    'id' => $t->id,
                    'name' => $t->name,
                    'code' => $t->code,
                    'slug' => $t->slug,
                ]),
            'attributes' => Attribute::query()
                ->with(['values' => fn ($q) => $q->orderBy('value')])
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (Attribute $a) => [
                    'id' => $a->id,
                    'name' => $a->name,
                    'values' => $a->values->map(fn (AttributeValue $v) => [
                        'id' => $v->id,
                        'value' => $v->value,
                    ])->values()->all(),
                ]),
            'low_stock_threshold' => Setting::lowStockThreshold(),
            'default_tax_percentage' => Setting::defaultTaxPercentage(),
            'default_tax_id' => Setting::taxIdMatchingDefaultPercentage(),
        ];
    }

    /**
     * @return list<string>
     */
    private function productCsvHeaders(): array
    {
        return [
            'category_id',
            'sub_category_id',
            'brand_id',
            'unit_id',
            'tax_id',
            'name',
            'sku',
            'barcode',
            'type',
            'sale_type',
            'purchase_price',
            'sale_price',
            'pack_sale_price',
            'carton_sale_price',
            'quantity_in_pack',
            'pack_in_carton',
            'status',
            'description',
        ];
    }

    /**
     * @return array{q: ?string, category_id: ?int, brand_id: ?int, type: ?string}
     */
    private function parseProductListFilters(Request $request): array
    {
        $typeFilter = $request->input('type');
        $typeDb = null;
        if (is_string($typeFilter) && $typeFilter !== '') {
            $typeDb = match ($typeFilter) {
                'normal', 'simple' => 'simple',
                'variation', 'master', 'variable' => 'variable',
                default => null,
            };
        }

        return [
            'q' => $request->filled('q') ? trim((string) $request->input('q')) : null,
            'category_id' => $request->filled('category_id') ? (int) $request->input('category_id') : null,
            'brand_id' => $request->filled('brand_id') ? (int) $request->input('brand_id') : null,
            'type' => $typeDb,
        ];
    }

    /**
     * @param  Builder<Product>  $query
     */
    private function applyProductListFilters(Builder $query, array $filters): void
    {
        if (($filters['q'] ?? null) !== null && $filters['q'] !== '') {
            $term = '%'.$filters['q'].'%';
            $query->where(function ($q) use ($term): void {
                $q->where('name', 'like', $term)
                    ->orWhere('slug', 'like', $term)
                    ->orWhereHas('brand', function ($bq) use ($term): void {
                        $bq->where('name', 'like', $term);
                    })
                    ->orWhereHas('varients', function ($vq) use ($term): void {
                        $vq->where('sku', 'like', $term)
                            ->orWhere('barcode', 'like', $term);
                    });
            });
        }

        if (! empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (! empty($filters['brand_id'])) {
            $query->where('brand_id', $filters['brand_id']);
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }
    }

    /**
     * Human-readable cost or selling column for the product list (single value or min–max for variants).
     */
    private function formatPriceRange(float $min, float $max): string
    {
        $fmt = fn (float $n): string => number_format($n, 2, '.', '');

        if (abs($min - $max) < 0.00001) {
            return $fmt($min);
        }

        return $fmt($min).' – '.$fmt($max);
    }

    public function index(Request $request): Response
    {
        $filters = $this->parseProductListFilters($request);
        $globalLow = Setting::lowStockThreshold();

        $query = Product::query()
            ->with([
                'category:id,name',
                'subCategory:id,name',
                'brand:id,name',
                'unit:id,name,symbol',
                'tax:id,name,code',
                'varients:id,product_id,sku,barcode,cost_price,selling_price',
            ])
            ->withSum(['stocks as total_stock' => fn ($q) => $q->where('status', 'active')], 'quantity')
            ->withSum(['stocks as total_reserved' => fn ($q) => $q->where('status', 'active')], 'reserved_quantity');

        $this->applyProductListFilters($query, $filters);

        $products = $query
            ->orderBy('name')
            ->paginate(15)
            ->through(function (Product $p) use ($globalLow): array {
                $primarySku = $p->varients->first()?->sku;

                if ($p->varients->isNotEmpty()) {
                    $costs = $p->varients->pluck('cost_price')->map(fn ($v) => (float) $v);
                    $sellings = $p->varients->pluck('selling_price')->map(fn ($v) => (float) $v);
                    $costLabel = $this->formatPriceRange($costs->min(), $costs->max());
                    $sellingLabel = $this->formatPriceRange($sellings->min(), $sellings->max());
                } else {
                    $costLabel = '0.00';
                    $sellingLabel = '0.00';
                }

                $available = (float) ($p->total_stock ?? 0) - (float) ($p->total_reserved ?? 0);
                $threshold = $p->quantity_alert !== null
                    ? (int) $p->quantity_alert
                    : $globalLow;

                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'sku' => $primarySku ?? '—',
                    'type' => $p->type,
                    'sale_type' => $p->sale_type,
                    'sale_type_label' => $p->sale_type === 'weight'
                        ? 'Weight / length'
                        : 'Quantity',
                    'status' => $p->status,
                    'stock' => (float) ($p->total_stock ?? 0),
                    'is_low_stock' => $p->status === 'active' && $available <= (float) $threshold,
                    'cost' => $costLabel,
                    'selling_price' => $sellingLabel,
                    'category' => $p->category?->name,
                    'unit' => $p->unit
                        ? ($p->unit->symbol ? $p->unit->name.' ('.$p->unit->symbol.')' : $p->unit->name)
                        : null,
                ];
            })
            ->withQueryString();

        $categories = Category::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Category $c) => [
                'id' => $c->id,
                'name' => $c->name,
            ]);

        $brands = Brand::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Brand $b) => [
                'id' => $b->id,
                'name' => $b->name,
            ]);

        return Inertia::render('Product/Index', [
            'products' => $products,
            'filters' => $filters,
            'categories' => $categories,
            'brands' => $brands,
        ]);
    }

    public function importForm(): Response
    {
        $this->authorize('create', Product::class);

        return Inertia::render('Product/Import');
    }

    public function importTemplate(): StreamedResponse
    {
        $this->authorize('create', Product::class);

        $headers = $this->productCsvHeaders();

        $example = [
            '1',
            '1',
            '',
            '1',
            '',
            'Example product',
            'EXAMPLE-SKU',
            '',
            'normal',
            'quantity',
            '0',
            '0',
            '0',
            '0',
            '1',
            '1',
            'active',
            '',
        ];

        $filename = 'products-import-template.csv';

        return response()->streamDownload(function () use ($headers, $example): void {
            $out = fopen('php://output', 'w');
            if ($out === false) {
                return;
            }
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, $headers);
            fputcsv($out, $example);
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function importStore(ImportProductRequest $request, ProductCsvImporter $importer): RedirectResponse
    {
        $this->authorize('create', Product::class);

        $path = $request->file('file')->getRealPath();
        if ($path === false) {
            return redirect()
                ->route('products.import')
                ->with('error', 'Could not read the uploaded file.');
        }

        $result = $importer->import($path, $request->boolean('add_for_sync'));

        $summaryLine = sprintf(
            'Import finished. Created %d, updated %d, skipped %d.',
            $result['created'],
            $result['updated'],
            $result['skipped'],
        );

        return redirect()
            ->route('products.import')
            ->with('success', $summaryLine)
            ->with('import_summary', [
                'created' => $result['created'],
                'updated' => $result['updated'],
                'skipped' => $result['skipped'],
            ])
            ->with('import_row_errors', array_slice($result['errors'], 0, 50));
    }

    public function export(Request $request): StreamedResponse
    {
        $this->authorize('viewAny', Product::class);

        $filters = $this->parseProductListFilters($request);
        $query = Product::query()->with([
            'varients' => fn ($q) => $q->orderBy('id')->select([
                'id', 'product_id', 'sku', 'barcode', 'cost_price', 'selling_price',
            ]),
        ]);
        $this->applyProductListFilters($query, $filters);

        $headers = $this->productCsvHeaders();
        $filename = 'products-export-'.now()->format('Y-m-d-His').'.csv';

        return response()->streamDownload(function () use ($query, $headers): void {
            $out = fopen('php://output', 'w');
            if ($out === false) {
                return;
            }

            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, $headers);

            foreach ($query->orderBy('name')->cursor() as $product) {
                $description = $product->description ?? '';
                $description = preg_replace('/\s+/u', ' ', $description) ?: '';

                $v = $product->varients->first();
                $csvType = match ($product->type) {
                    'simple' => 'normal',
                    'variable' => 'variation',
                    default => 'normal',
                };

                fputcsv($out, [
                    (string) $product->category_id,
                    (string) $product->sub_category_id,
                    $product->brand_id !== null ? (string) $product->brand_id : '',
                    (string) $product->unit_id,
                    $product->tax_id !== null ? (string) $product->tax_id : '',
                    $product->name,
                    $v?->sku ?? '',
                    $v?->barcode ?? '',
                    $csvType,
                    $product->sale_type,
                    (string) ($v?->cost_price ?? '0.00'),
                    (string) ($v?->selling_price ?? '0.00'),
                    '0.00',
                    '0.00',
                    (string) $product->quantity_in_pack,
                    (string) $product->pack_in_carton,
                    $product->status,
                    $description,
                ]);
            }

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Product/Create', $this->formOptions());
    }

    public function pos(): Response
    {
        $this->authorize('lookupByBarcode', Product::class);

        return Inertia::render('POS/Index');
    }

    public function getProductByBarcode(string $barcode): JsonResponse
    {
        $this->authorize('lookupByBarcode', Product::class);

        $normalized = preg_replace('/\D+/', '', $barcode) ?? '';
        if (strlen($normalized) !== 12) {
            return response()->json([
                'message' => 'Barcode must be 12 digits.',
            ], 422);
        }

        $variant = ProductVarient::query()
            ->where('barcode', $normalized)
            ->with([
                'product' => fn ($q) => $q->with([
                    'unit:id,name,symbol',
                    'category:id,name',
                    'tax:id,rate,type,status',
                ]),
            ])
            ->first();

        if ($variant === null || $variant->product === null) {
            return response()->json([
                'message' => 'Product not found.',
            ], 404);
        }

        $product = $variant->product;

        $taxPct = 0.0;
        if ($product->tax && $product->tax->status === 'active' && $product->tax->type === 'percentage') {
            $taxPct = (float) $product->tax->rate;
        }

        return response()->json([
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'sale_type' => $product->sale_type,
                'tax_percentage' => $taxPct,
                'image_url' => $product->imagePublicUrl(),
                'unit' => $product->unit
                    ? [
                        'id' => $product->unit->id,
                        'name' => $product->unit->name,
                        'symbol' => $product->unit->symbol,
                    ]
                    : null,
                'category' => $product->category
                    ? ['id' => $product->category->id, 'name' => $product->category->name]
                    : null,
            ],
            'variant' => [
                'id' => $variant->id,
                'name' => $variant->name,
                'sku' => $variant->sku,
                'barcode' => $variant->barcode,
                'cost_price' => (string) $variant->cost_price,
                'selling_price' => (string) $variant->selling_price,
            ],
        ]);
    }

    public function store(StoreProductRequest $request, ProductBarcodeGenerator $barcodeGenerator): RedirectResponse
    {
        $variants = $request->input('variants', []);
        $type = (string) $request->input('type', 'simple');

        $product = DB::transaction(function () use ($request, $variants, $type, $barcodeGenerator) {
            $productData = $request->safe()->only([
                'category_id',
                'sub_category_id',
                'brand_id',
                'unit_id',
                'tax_id',
                'name',
                'type',
                'sale_type',
                'quantity_in_pack',
                'pack_in_carton',
                'description',
                'status',
                'alert_message',
                'expiry_alert',
                'quantity_alert',
            ]);

            $productData['alert'] = $request->boolean('alert', false);

            if ($request->hasFile('image')) {
                $productData['image'] = $request->file('image')->store('products/images', 'public');
            }

            $product = Product::create($productData);

            if ($type === 'simple') {
                $barcode = $request->input('barcode');
                if ($barcode === null || $barcode === '') {
                    $barcode = $barcodeGenerator->generateUnique();
                }

                ProductVarient::create([
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'sku' => (string) $request->input('sku'),
                    'barcode' => $barcode,
                    'cost_price' => $request->input('purchase_price'),
                    'selling_price' => $request->input('sale_price'),
                    'status' => 'active',
                ]);
            }

            foreach ($variants as $variantPayload) {
                $variantBarcode = $variantPayload['barcode'] ?? null;
                if ($variantBarcode === null || $variantBarcode === '') {
                    $variantBarcode = $barcodeGenerator->generateUnique();
                }

                $variant = ProductVarient::create([
                    'product_id' => $product->id,
                    'name' => $variantPayload['name'],
                    'sku' => $variantPayload['sku'],
                    'barcode' => $variantBarcode,
                    'cost_price' => $variantPayload['cost_price'],
                    'selling_price' => $variantPayload['selling_price'],
                    'status' => $variantPayload['status'] ?? 'active',
                ]);

                foreach (($variantPayload['attribute_values'] ?? []) as $attributeValuePayload) {
                    $attributeId = (int) ($attributeValuePayload['attribute_id'] ?? 0);
                    $valueText = trim((string) ($attributeValuePayload['value'] ?? ''));

                    if (! $attributeId || $valueText === '') {
                        continue;
                    }

                    $attributeValue = AttributeValue::query()->firstOrCreate([
                        'attribute_id' => $attributeId,
                        'value' => $valueText,
                    ]);

                    ProductVarientAttribute::create([
                        'product_varient_id' => $variant->id,
                        'attribute_id' => $attributeId,
                        'attribute_value_id' => $attributeValue->id,
                    ]);
                }
            }

            return $product;
        });

        return redirect()->route('products.show', $product)
            ->with('success', 'Product created.');
    }

    public function show(Product $product, ProductBarcodeRenderer $barcodeRenderer): Response
    {
        $product->load([
            'category:id,name,slug',
            'subCategory:id,name,slug',
            'brand:id,name,slug',
            'unit:id,name,symbol,slug',
            'tax:id,name,code,slug',
            'varients' => fn ($q) => $q->orderBy('id')->select([
                'id', 'product_id', 'name', 'sku', 'barcode', 'cost_price', 'selling_price', 'status',
            ]),
        ]);

        $v = $product->varients->first();
        $barcodeStr = $v?->barcode ?? '';

        $variants = $product->varients->map(function (ProductVarient $pv) use ($barcodeRenderer): array {
            $b = $pv->barcode ?? '';

            return [
                'id' => $pv->id,
                'name' => $pv->name,
                'sku' => $pv->sku,
                'barcode' => $b,
                'barcode_image_src' => $barcodeRenderer->code128PngDataUri($b),
                'cost_price' => (string) $pv->cost_price,
                'selling_price' => (string) $pv->selling_price,
                'status' => $pv->status,
            ];
        })->values()->all();

        return Inertia::render('Product/Show', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'type' => $product->type,
                'sku' => $v?->sku ?? '',
                'barcode' => $barcodeStr,
                'barcode_image_src' => $barcodeRenderer->code128PngDataUri($barcodeStr),
                'sale_type' => $product->sale_type,
                'purchase_price' => (string) ($v?->cost_price ?? '0.00'),
                'sale_price' => (string) ($v?->selling_price ?? '0.00'),
                'quantity_in_pack' => $product->quantity_in_pack,
                'pack_in_carton' => $product->pack_in_carton,
                'image_url' => $product->imagePublicUrl(),
                'description' => $product->description,
                'alert' => $product->alert,
                'alert_message' => $product->alert_message,
                'expiry_alert' => $product->expiry_alert,
                'quantity_alert' => $product->quantity_alert,
                'status' => $product->status,
                'variants' => $variants,
                'category' => $product->category
                    ? ['id' => $product->category->id, 'name' => $product->category->name, 'slug' => $product->category->slug]
                    : null,
                'sub_category' => $product->subCategory
                    ? ['id' => $product->subCategory->id, 'name' => $product->subCategory->name, 'slug' => $product->subCategory->slug]
                    : null,
                'brand' => $product->brand
                    ? ['id' => $product->brand->id, 'name' => $product->brand->name, 'slug' => $product->brand->slug]
                    : null,
                'unit' => $product->unit
                    ? ['id' => $product->unit->id, 'name' => $product->unit->name, 'symbol' => $product->unit->symbol]
                    : null,
                'tax' => $product->tax
                    ? ['id' => $product->tax->id, 'name' => $product->tax->name, 'code' => $product->tax->code]
                    : null,
            ],
        ]);
    }

    public function edit(Product $product): Response
    {
        $product->load([
            'varients' => fn ($q) => $q->orderBy('id')->with([
                'varientAttributes' => fn ($aq) => $aq->with('attributeValue'),
            ]),
        ]);
        $v = $product->varients->first();

        $variants = $product->varients->map(function (ProductVarient $pv): array {
            return [
                'id' => $pv->id,
                'name' => $pv->name,
                'sku' => $pv->sku,
                'barcode' => $pv->barcode,
                'cost_price' => (string) $pv->cost_price,
                'selling_price' => (string) $pv->selling_price,
                'status' => $pv->status,
                'attribute_values' => $pv->varientAttributes->map(
                    fn (ProductVarientAttribute $pva): array => [
                        'attribute_id' => $pva->attribute_id,
                        'value' => $pva->attributeValue?->value ?? '',
                    ],
                )->values()->all(),
            ];
        })->values()->all();

        return Inertia::render('Product/Edit', [
            ...$this->formOptions(),
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'type' => $product->type,
                'category_id' => $product->category_id,
                'sub_category_id' => $product->sub_category_id,
                'brand_id' => $product->brand_id,
                'unit_id' => $product->unit_id,
                'tax_id' => $product->tax_id,
                'sku' => $v?->sku ?? '',
                'barcode' => $v?->barcode ?? '',
                'sale_type' => $product->sale_type ?? 'quantity',
                'purchase_price' => (string) ($v?->cost_price ?? '0.00'),
                'sale_price' => (string) ($v?->selling_price ?? '0.00'),
                'quantity_in_pack' => $product->quantity_in_pack,
                'pack_in_carton' => $product->pack_in_carton,
                'image_url' => $product->imagePublicUrl(),
                'description' => $product->description ?? '',
                'alert' => $product->alert,
                'alert_message' => $product->alert_message ?? '',
                'expiry_alert' => $product->expiry_alert,
                'quantity_alert' => $product->quantity_alert,
                'status' => $product->status,
                'variants' => $variants,
            ],
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product, ProductBarcodeGenerator $barcodeGenerator): RedirectResponse
    {
        $data = $request->safe()->only([
            'category_id',
            'sub_category_id',
            'brand_id',
            'unit_id',
            'tax_id',
            'name',
            'sale_type',
            'quantity_in_pack',
            'pack_in_carton',
            'description',
            'status',
            'alert_message',
            'expiry_alert',
            'quantity_alert',
        ]);

        if ($request->hasFile('image')) {
            if ($product->image && str_starts_with($product->image, 'products/')) {
                Storage::disk('public')->delete($product->image);
            }

            $data['image'] = $request->file('image')->store('products/images', 'public');
        }

        $data['alert'] = $request->boolean('alert', false);

        DB::transaction(function () use ($request, $product, $data, $barcodeGenerator): void {
            $product->update($data);

            if ($product->type === 'variable') {
                $variants = $request->input('variants', []);
                $ids = collect($variants)
                    ->pluck('id')
                    ->map(fn ($id) => (int) $id)
                    ->filter()
                    ->values()
                    ->all();

                ProductVarient::query()
                    ->where('product_id', $product->id)
                    ->whereNotIn('id', $ids)
                    ->get()
                    ->each(fn (ProductVarient $orphan) => $orphan->delete());

                foreach ($variants as $variantPayload) {
                    $id = (int) ($variantPayload['id'] ?? 0);
                    $variant = ProductVarient::query()
                        ->where('product_id', $product->id)
                        ->where('id', $id)
                        ->first();

                    if ($variant === null) {
                        continue;
                    }

                    $barcode = $variantPayload['barcode'] ?? null;
                    if ($barcode === null || $barcode === '') {
                        $barcode = $variant->barcode;
                    }
                    if ($barcode === null || $barcode === '') {
                        $barcode = $barcodeGenerator->generateUnique();
                    }

                    $variant->update([
                        'name' => $variantPayload['name'],
                        'sku' => $variantPayload['sku'],
                        'barcode' => $barcode,
                        'cost_price' => $variantPayload['cost_price'],
                        'selling_price' => $variantPayload['selling_price'],
                        'status' => $variantPayload['status'] ?? 'active',
                    ]);
                }

                return;
            }

            $variant = $product->varients()->orderBy('id')->first();
            $barcode = $request->input('barcode');
            if ($barcode === null || $barcode === '') {
                $barcode = $variant?->barcode;
            }
            if ($barcode === null || $barcode === '') {
                $barcode = $barcodeGenerator->generateUnique();
            }

            $payload = [
                'sku' => (string) $request->input('sku'),
                'barcode' => $barcode,
                'cost_price' => $request->input('purchase_price'),
                'selling_price' => $request->input('sale_price'),
            ];

            if ($variant !== null) {
                $variant->update($payload);
            } elseif ($product->type === 'simple') {
                ProductVarient::create([
                    'product_id' => $product->id,
                    'name' => $product->name,
                    ...$payload,
                    'status' => 'active',
                ]);
            }
        });

        return redirect()->route('products.show', $product)
            ->with('success', 'Product updated.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        if ($product->image && str_starts_with($product->image, 'products/')) {
            Storage::disk('public')->delete($product->image);
        }

        $product->delete();

        return redirect()->route('products.index')
            ->with('success', 'Product deleted.');
    }
}
