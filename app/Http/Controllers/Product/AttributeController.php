<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreAttributeRequest;
use App\Http\Requests\Product\UpdateAttributeRequest;
use App\Models\Product\Attribute;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AttributeController extends Controller
{
    public function index(): Response
    {
        $attributes = Attribute::query()
            ->withCount('values')
            ->orderBy('name')
            ->paginate(15)
            ->through(fn (Attribute $attribute) => [
                'id' => $attribute->id,
                'name' => $attribute->name,
                'slug' => $attribute->slug,
                'status' => $attribute->status,
                'values_count' => $attribute->values_count,
            ])
            ->withQueryString();

        return Inertia::render('Attribute/Index', [
            'attributes' => $attributes,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Attribute/Create');
    }

    public function store(StoreAttributeRequest $request): RedirectResponse
    {
        Attribute::create($request->validated());

        return redirect()->route('attributes.index')
            ->with('success', 'Attribute created.');
    }

    public function quickStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('attributes', 'name')],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $attribute = Attribute::create($validated);

        return response()->json([
            'attribute' => [
                'id' => $attribute->id,
                'name' => $attribute->name,
                'values' => [],
            ],
        ], 201);
    }

    public function show(Attribute $attribute): Response
    {
        $attribute->load(['values' => fn ($q) => $q->orderBy('value')]);

        return Inertia::render('Attribute/Show', [
            'attribute' => [
                'id' => $attribute->id,
                'name' => $attribute->name,
                'slug' => $attribute->slug,
                'status' => $attribute->status,
                'values' => $attribute->values
                    ->map(fn ($value) => [
                        'id' => $value->id,
                        'value' => $value->value,
                    ])
                    ->values()
                    ->all(),
            ],
        ]);
    }

    public function edit(Attribute $attribute): Response
    {
        return Inertia::render('Attribute/Edit', [
            'attribute' => [
                'id' => $attribute->id,
                'name' => $attribute->name,
                'slug' => $attribute->slug,
                'status' => $attribute->status,
            ],
        ]);
    }

    public function update(UpdateAttributeRequest $request, Attribute $attribute): RedirectResponse
    {
        $attribute->update($request->validated());

        return redirect()->route('attributes.index')
            ->with('success', 'Attribute updated.');
    }

    public function destroy(Attribute $attribute): RedirectResponse
    {
        $attribute->delete();

        return redirect()->route('attributes.index')
            ->with('success', 'Attribute deleted.');
    }
}
