<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Models\Company\Warehouse;
use App\Models\Product\Product;
use App\Models\ProductBatch;
use App\Models\ProductSerial;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductSerialController extends Controller
{
    public function index(Product $product)
    {
        $serials = ProductSerial::query()
            ->where('product_id', $product->id)
            ->with([
                'batch:id,product_id,product_variant_id,batch_number,expiry_date',
                'batch.productVarient:id,product_id,name,sku',
                'warehouse:id,name',
            ])
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Product/Serial/Index', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'type' => $product->type,
            ],
            'serials' => $serials,
        ]);
    }

    public function create(Product $product)
    {
        $batches = ProductBatch::query()
            ->where('product_id', $product->id)
            ->with(['productVarient:id,product_id,name,sku'])
            ->orderByDesc('id')
            ->limit(500)
            ->get();

        $warehouses = Warehouse::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'branch_id']);

        return Inertia::render('Product/Serial/Create', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'type' => $product->type,
            ],
            'batches' => $batches,
            'warehouses' => $warehouses,
        ]);
    }

    public function store(Request $request, Product $product)
    {
        $data = $request->validate([
            'product_batch_id' => ['nullable', 'integer', 'exists:product_batches,id'],
            'warehouse_id' => ['nullable', 'integer', 'exists:warehouses,id'],
            'serial_number' => ['required', 'string', 'max:255'],
            'status' => ['required', 'in:available,sold,returned,damaged'],
        ]);

        if (! empty($data['product_batch_id'])) {
            $ok = ProductBatch::query()
                ->where('id', $data['product_batch_id'])
                ->where('product_id', $product->id)
                ->exists();
            if (! $ok) {
                return back()->with('error', 'Selected batch does not belong to this product.');
            }
        }

        $data['product_id'] = $product->id;

        ProductSerial::query()->create($data);

        return redirect()
            ->route('products.serials.index', $product->slug)
            ->with('success', 'Serial created.');
    }

    public function edit(Product $product, ProductSerial $serial)
    {
        abort_unless($serial->product_id === $product->id, 404);

        $batches = ProductBatch::query()
            ->where('product_id', $product->id)
            ->with(['productVarient:id,product_id,name,sku'])
            ->orderByDesc('id')
            ->limit(500)
            ->get();

        $warehouses = Warehouse::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'branch_id']);

        $serial->load([
            'batch:id,product_id,product_variant_id,batch_number,expiry_date',
            'batch.productVarient:id,product_id,name,sku',
            'warehouse:id,name',
        ]);

        return Inertia::render('Product/Serial/Edit', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'type' => $product->type,
            ],
            'serial' => $serial,
            'batches' => $batches,
            'warehouses' => $warehouses,
        ]);
    }

    public function update(Request $request, Product $product, ProductSerial $serial)
    {
        abort_unless($serial->product_id === $product->id, 404);

        $data = $request->validate([
            'product_batch_id' => ['nullable', 'integer', 'exists:product_batches,id'],
            'warehouse_id' => ['nullable', 'integer', 'exists:warehouses,id'],
            'serial_number' => ['required', 'string', 'max:255'],
            'status' => ['required', 'in:available,sold,returned,damaged'],
        ]);

        if (! empty($data['product_batch_id'])) {
            $ok = ProductBatch::query()
                ->where('id', $data['product_batch_id'])
                ->where('product_id', $product->id)
                ->exists();
            if (! $ok) {
                return back()->with('error', 'Selected batch does not belong to this product.');
            }
        }

        $serial->update($data);

        return redirect()
            ->route('products.serials.index', $product->slug)
            ->with('success', 'Serial updated.');
    }

    public function destroy(Product $product, ProductSerial $serial)
    {
        abort_unless($serial->product_id === $product->id, 404);

        $serial->delete();

        return back()->with('success', 'Serial deleted.');
    }
}
