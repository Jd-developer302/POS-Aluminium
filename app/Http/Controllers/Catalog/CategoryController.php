<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreCategoryRequest;
use App\Http\Requests\Catalog\UpdateCategoryRequest;
use App\Models\Product\Category;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    use AuthorizesRequests;

    public function __construct()
    {
        $this->authorizeResource(Category::class, 'category');
    }

    public function index(): Response
    {
        $categories = Category::query()
            ->orderBy('name')
            ->paginate(15)
            ->through(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'status' => $category->status,
                'image_url' => $category->imagePublicUrl(),
            ])
            ->withQueryString();

        return Inertia::render('Category/Index', [
            'categories' => $categories,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Category/Create');
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $data = $request->safe()->except('image');

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('categories/images', 'public');
        }

        Category::create($data);

        return redirect()->route('categories.index')
            ->with('success', 'Category created.');
    }

    public function quickStore(Request $request): JsonResponse
    {
        $this->authorize('create', Category::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $category = Category::create($validated);

        return response()->json([
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
            ],
        ], 201);
    }

    public function show(Category $category): Response
    {
        return Inertia::render('Category/Show', [
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'image' => $category->image,
                'image_url' => $category->imagePublicUrl(),
                'status' => $category->status,
            ],
        ]);
    }

    public function edit(Category $category): Response
    {
        return Inertia::render('Category/Edit', [
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'image_url' => $category->imagePublicUrl(),
                'status' => $category->status,
            ],
        ]);
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $data = $request->safe()->except('image');

        if ($request->hasFile('image')) {
            if ($category->image && str_starts_with($category->image, 'categories/')) {
                Storage::disk('public')->delete($category->image);
            }

            $data['image'] = $request->file('image')->store('categories/images', 'public');
        }

        $category->update($data);

        return redirect()->route('categories.index')
            ->with('success', 'Category updated.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        if ($category->image && str_starts_with($category->image, 'categories/')) {
            Storage::disk('public')->delete($category->image);
        }

        $category->delete();

        return redirect()->route('categories.index')
            ->with('success', 'Category deleted.');
    }
}
