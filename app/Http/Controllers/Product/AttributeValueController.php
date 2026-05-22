<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreAttributeValueRequest;
use App\Http\Requests\Product\UpdateAttributeValueRequest;
use App\Models\Product\Attribute;
use App\Models\Product\AttributeValue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AttributeValueController extends Controller
{
    public function index(): Response
    {
        $attributeValues = AttributeValue::query()
            ->with('attribute:id,name')
            ->orderBy('value')
            ->paginate(15)
            ->through(fn (AttributeValue $attributeValue) => [
                'id' => $attributeValue->id,
                'value' => $attributeValue->value,
                'slug' => $attributeValue->slug,
                'status' => $attributeValue->status,
                'attribute' => $attributeValue->attribute
                    ? [
                        'id' => $attributeValue->attribute->id,
                        'name' => $attributeValue->attribute->name,
                    ]
                    : null,
            ])
            ->withQueryString();

        return Inertia::render('AttributeValue/Index', [
            'attributeValues' => $attributeValues,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('AttributeValue/Create', [
            'attributes' => $this->attributesForForm(),
        ]);
    }

    public function store(StoreAttributeValueRequest $request): RedirectResponse
    {
        AttributeValue::create($request->validated());

        return redirect()->route('attribute-values.index')
            ->with('success', 'Attribute value created.');
    }

    public function quickStore(Request $request): JsonResponse
    {
        $attributeId = (int) $request->input('attribute_id');

        $validated = $request->validate([
            'attribute_id' => ['required', 'integer', 'exists:attributes,id'],
            'value' => [
                'required',
                'string',
                'max:255',
                Rule::unique('attribute_values', 'value')
                    ->where(fn ($q) => $q->where('attribute_id', $attributeId)),
            ],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $attributeValue = AttributeValue::create($validated);

        return response()->json([
            'attribute_value' => [
                'id' => $attributeValue->id,
                'attribute_id' => $attributeValue->attribute_id,
                'value' => $attributeValue->value,
            ],
        ], 201);
    }

    public function show(AttributeValue $attributeValue): Response
    {
        $attributeValue->load('attribute:id,name');

        return Inertia::render('AttributeValue/Show', [
            'attributeValue' => [
                'id' => $attributeValue->id,
                'value' => $attributeValue->value,
                'slug' => $attributeValue->slug,
                'status' => $attributeValue->status,
                'attribute' => $attributeValue->attribute
                    ? [
                        'id' => $attributeValue->attribute->id,
                        'name' => $attributeValue->attribute->name,
                    ]
                    : null,
            ],
        ]);
    }

    public function edit(AttributeValue $attributeValue): Response
    {
        return Inertia::render('AttributeValue/Edit', [
            'attributeValue' => [
                'id' => $attributeValue->id,
                'value' => $attributeValue->value,
                'slug' => $attributeValue->slug,
                'status' => $attributeValue->status,
                'attribute_id' => $attributeValue->attribute_id,
            ],
            'attributes' => $this->attributesForForm(),
        ]);
    }

    public function update(UpdateAttributeValueRequest $request, AttributeValue $attributeValue): RedirectResponse
    {
        $attributeValue->update($request->validated());

        return redirect()->route('attribute-values.index')
            ->with('success', 'Attribute value updated.');
    }

    public function destroy(AttributeValue $attributeValue): RedirectResponse
    {
        $attributeValue->delete();

        return redirect()->route('attribute-values.index')
            ->with('success', 'Attribute value deleted.');
    }

    /**
     * @return list<array{id: int, name: string}>
     */
    private function attributesForForm(): array
    {
        return Attribute::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Attribute $attribute) => [
                'id' => $attribute->id,
                'name' => $attribute->name,
            ])
            ->values()
            ->all();
    }
}
