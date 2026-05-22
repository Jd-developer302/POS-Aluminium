<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreSubCategoryRequest;
use App\Http\Requests\Catalog\UpdateSubCategoryRequest;
use App\Models\Product\Category;
use App\Models\Product\SubCategory;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SubCategoryController extends Controller
{
    use AuthorizesRequests;

    public function __construct()
    {
        $this->authorizeResource(SubCategory::class, 'sub_category');
    }

    public function index(): Response
    {
        $subCategories = SubCategory::query()
            ->with('category:id,name,slug')
            ->orderBy('name')
            ->paginate(15)
            ->through(fn (SubCategory $sub) => [
                'id' => $sub->id,
                'name' => $sub->name,
                'slug' => $sub->slug,
                'status' => $sub->status,
                'image_url' => $sub->imagePublicUrl(),
                'category' => $sub->category
                    ? [
                        'id' => $sub->category->id,
                        'name' => $sub->category->name,
                        'slug' => $sub->category->slug,
                    ]
                    : null,
            ])
            ->withQueryString();

        return Inertia::render('SubCategory/Index', [
            'subCategories' => $subCategories,
        ]);
    }

    public function create(): Response
    {
        $categories = Category::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (Category $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
            ]);

        return Inertia::render('SubCategory/Create', [
            'categories' => $categories,
        ]);
    }

    public function store(StoreSubCategoryRequest $request): RedirectResponse
    {
        $data = $request->safe()->except('image');

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('sub_categories/images', 'public');
        }

        SubCategory::create($data);

        return redirect()->route('sub-categories.index')
            ->with('success', 'Subcategory created.');
    }

    public function quickStore(Request $request): JsonResponse
    {
        $this->authorize('create', SubCategory::class);

        $validated = $request->validate([
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $subCategory = SubCategory::create($validated);

        return response()->json([
            'sub_category' => [
                'id' => $subCategory->id,
                'name' => $subCategory->name,
                'slug' => $subCategory->slug,
                'category_id' => $subCategory->category_id,
            ],
        ], 201);
    }

    public function show(SubCategory $sub_category): Response
    {
        $sub_category->load('category:id,name,slug');

        return Inertia::render('SubCategory/Show', [
            'subCategory' => [
                'id' => $sub_category->id,
                'name' => $sub_category->name,
                'slug' => $sub_category->slug,
                'image' => $sub_category->image,
                'image_url' => $sub_category->imagePublicUrl(),
                'status' => $sub_category->status,
                'category' => $sub_category->category
                    ? [
                        'id' => $sub_category->category->id,
                        'name' => $sub_category->category->name,
                        'slug' => $sub_category->category->slug,
                    ]
                    : null,
            ],
        ]);
    }

    public function edit(SubCategory $sub_category): Response
    {
        $categories = Category::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (Category $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
            ]);

        return Inertia::render('SubCategory/Edit', [
            'categories' => $categories,
            'subCategory' => [
                'id' => $sub_category->id,
                'name' => $sub_category->name,
                'slug' => $sub_category->slug,
                'category_id' => $sub_category->category_id,
                'image_url' => $sub_category->imagePublicUrl(),
                'status' => $sub_category->status,
            ],
        ]);
    }

    public function update(UpdateSubCategoryRequest $request, SubCategory $sub_category): RedirectResponse
    {
        $data = $request->safe()->except('image');

        if ($request->hasFile('image')) {
            if ($sub_category->image && str_starts_with($sub_category->image, 'sub_categories/')) {
                Storage::disk('public')->delete($sub_category->image);
            }

            $data['image'] = $request->file('image')->store('sub_categories/images', 'public');
        }

        $sub_category->update($data);

        return redirect()->route('sub-categories.index')
            ->with('success', 'Subcategory updated.');
    }

    public function destroy(SubCategory $sub_category): RedirectResponse
    {
        if ($sub_category->image && str_starts_with($sub_category->image, 'sub_categories/')) {
            Storage::disk('public')->delete($sub_category->image);
        }

        $sub_category->delete();

        return redirect()->route('sub-categories.index')
            ->with('success', 'Subcategory deleted.');
    }
}
