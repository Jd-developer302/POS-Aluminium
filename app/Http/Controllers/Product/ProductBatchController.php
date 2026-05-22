<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Models\Product\Product;
use App\Models\Product\ProductVarient;
use App\Models\ProductBatch;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductBatchController extends Controller
{
    public function index(Product $product)
    {
        $product->load(['varients:id,product_id,name,sku']);

        $batches = ProductBatch::query()
            ->where('product_id', $product->id)
            ->with(['productVarient:id,product_id,name,sku'])
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Product/Batch/Index', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'type' => $product->type,
            ],
            'variants' => $product->varients->map(fn (ProductVarient $v) => [
                'id' => $v->id,
                'name' => $v->name,
                'sku' => $v->sku,
            ])->values(),
            'batches' => $batches,
        ]);
    }

    public function create(Product $product)
    {
        $product->load(['varients:id,product_id,name,sku']);

        return Inertia::render('Product/Batch/Create', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'type' => $product->type,
            ],
            'variants' => $product->varients->map(fn (ProductVarient $v) => [
                'id' => $v->id,
                'name' => $v->name,
                'sku' => $v->sku,
            ])->values(),
        ]);
    }

    public function store(Request $request, Product $product)
    {
        $hasVariants = $product->type === 'variable'
            && ProductVarient::query()->where('product_id', $product->id)->exists();

        $data = $request->validate([
            'product_variant_id' => [$hasVariants ? 'required' : 'nullable', 'integer', 'exists:product_varients,id'],
            'batch_number' => ['required', 'string', 'max:255'],
            'manufacture_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date', 'after_or_equal:manufacture_date'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'selling_price' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (! $hasVariants) {
            $data['product_variant_id'] = null;
        } else {
            $ok = ProductVarient::query()
                ->where('id', $data['product_variant_id'])
                ->where('product_id', $product->id)
                ->exists();
            if (! $ok) {
                return back()->with('error', 'Selected variant does not belong to this product.');
            }
        }

        $data['product_id'] = $product->id;
        $data['is_active'] = (bool) ($data['is_active'] ?? true);

        ProductBatch::query()->create($data);

        return redirect()
            ->route('products.batches.index', $product->slug)
            ->with('success', 'Batch created.');
    }

    public function edit(Product $product, ProductBatch $batch)
    {
        abort_unless($batch->product_id === $product->id, 404);

        $product->load(['varients:id,product_id,name,sku']);

        return Inertia::render('Product/Batch/Edit', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'type' => $product->type,
            ],
            'variants' => $product->varients->map(fn (ProductVarient $v) => [
                'id' => $v->id,
                'name' => $v->name,
                'sku' => $v->sku,
            ])->values(),
            'batch' => $batch,
        ]);
    }

    public function update(Request $request, Product $product, ProductBatch $batch)
    {
        abort_unless($batch->product_id === $product->id, 404);

        $hasVariants = $product->type === 'variable'
            && ProductVarient::query()->where('product_id', $product->id)->exists();

        $data = $request->validate([
            'product_variant_id' => [$hasVariants ? 'required' : 'nullable', 'integer', 'exists:product_varients,id'],
            'batch_number' => ['required', 'string', 'max:255'],
            'manufacture_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date', 'after_or_equal:manufacture_date'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'selling_price' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (! $hasVariants) {
            $data['product_variant_id'] = null;
        } else {
            $ok = ProductVarient::query()
                ->where('id', $data['product_variant_id'])
                ->where('product_id', $product->id)
                ->exists();
            if (! $ok) {
                return back()->with('error', 'Selected variant does not belong to this product.');
            }
        }

        $data['is_active'] = (bool) ($data['is_active'] ?? true);

        $batch->update($data);

        return redirect()
            ->route('products.batches.index', $product->slug)
            ->with('success', 'Batch updated.');
    }

    public function destroy(Product $product, ProductBatch $batch)
    {
        abort_unless($batch->product_id === $product->id, 404);

        $batch->delete();

        return back()->with('success', 'Batch deleted.');
    }
}
