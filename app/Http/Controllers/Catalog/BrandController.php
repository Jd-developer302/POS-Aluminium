<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreBrandRequest;
use App\Http\Requests\Catalog\UpdateBrandRequest;
use App\Models\Product\Brand;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BrandController extends Controller
{
    use AuthorizesRequests;

    public function __construct()
    {
        $this->authorizeResource(Brand::class, 'brand');
    }

    public function index(): Response
    {
        $brands = Brand::query()
            ->orderBy('name')
            ->paginate(15)
            ->through(fn (Brand $brand) => [
                'id' => $brand->id,
                'name' => $brand->name,
                'slug' => $brand->slug,
                'status' => $brand->status,
                'logo_url' => $brand->logoPublicUrl(),
            ])
            ->withQueryString();

        return Inertia::render('Brand/Index', [
            'brands' => $brands,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Brand/Create');
    }

    public function store(StoreBrandRequest $request): RedirectResponse
    {
        $data = $request->safe()->except('logo');

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('brands/logos', 'public');
        }

        Brand::create($data);

        return redirect()->route('brands.index')
            ->with('success', 'Brand created.');
    }

    public function quickStore(Request $request): JsonResponse
    {
        $this->authorize('create', Brand::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $brand = Brand::create($validated);

        return response()->json([
            'brand' => [
                'id' => $brand->id,
                'name' => $brand->name,
                'slug' => $brand->slug,
            ],
        ], 201);
    }

    public function show(Brand $brand): Response
    {
        return Inertia::render('Brand/Show', [
            'brand' => [
                'id' => $brand->id,
                'name' => $brand->name,
                'slug' => $brand->slug,
                'logo' => $brand->logo,
                'logo_url' => $brand->logoPublicUrl(),
                'status' => $brand->status,
            ],
        ]);
    }

    public function edit(Brand $brand): Response
    {
        return Inertia::render('Brand/Edit', [
            'brand' => [
                'id' => $brand->id,
                'name' => $brand->name,
                'slug' => $brand->slug,
                'logo_url' => $brand->logoPublicUrl(),
                'status' => $brand->status,
            ],
        ]);
    }

    public function update(UpdateBrandRequest $request, Brand $brand): RedirectResponse
    {
        $data = $request->safe()->except('logo');

        if ($request->hasFile('logo')) {
            if ($brand->logo && str_starts_with($brand->logo, 'brands/')) {
                Storage::disk('public')->delete($brand->logo);
            }

            $data['logo'] = $request->file('logo')->store('brands/logos', 'public');
        }

        $brand->update($data);

        return redirect()->route('brands.index')
            ->with('success', 'Brand updated.');
    }

    public function destroy(Brand $brand): RedirectResponse
    {
        if ($brand->logo && str_starts_with($brand->logo, 'brands/')) {
            Storage::disk('public')->delete($brand->logo);
        }

        $brand->delete();

        return redirect()->route('brands.index')
            ->with('success', 'Brand deleted.');
    }
}
