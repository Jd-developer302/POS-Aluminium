<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('products.create') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $merge = [];

        if (! $this->hasFile('image')) {
            $merge['image'] = $this->input('image') === '' ? null : $this->input('image');
        }

        if ($this->has('barcode') && $this->input('barcode') === '') {
            $merge['barcode'] = null;
        }

        $variants = $this->input('variants');
        if (is_array($variants)) {
            foreach ($variants as $i => $row) {
                if (! is_array($row)) {
                    continue;
                }
                if (($row['barcode'] ?? null) === '') {
                    $variants[$i]['barcode'] = null;
                }
            }
            $merge['variants'] = $variants;
        }

        if ($merge !== []) {
            $this->merge($merge);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $categoryId = (int) $this->input('category_id');
        $type = (string) $this->input('type', 'simple');

        $variantRule = $type === 'variable'
            ? ['required', 'array', 'min:1']
            : ['nullable', 'array'];

        $rules = [
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'sub_category_id' => [
                'required',
                'integer',
                Rule::exists('sub_categories', 'id')->where(
                    fn ($q) => $q->where('category_id', $categoryId),
                ),
            ],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'unit_id' => ['required', 'integer', 'exists:units,id'],
            'tax_id' => ['nullable', 'integer', 'exists:taxes,id'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['simple', 'variable'])],
            'sale_type' => ['required', Rule::in(['quantity', 'weight'])],
            'quantity_in_pack' => ['required', 'integer', 'min:1'],
            'pack_in_carton' => ['required', 'integer', 'min:1'],
            'image' => ['nullable', 'file', 'mimes:jpeg,jpg,png,gif,webp', 'max:2048'],
            'description' => ['nullable', 'string'],
            'alert' => ['nullable', 'boolean'],
            'alert_message' => ['nullable', 'string'],
            'expiry_alert' => ['nullable', 'integer', 'min:0'],
            'quantity_alert' => ['nullable', 'integer', 'min:0'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'variants' => $variantRule,
            'variants.*.name' => ['required_with:variants', 'string', 'max:255'],
            'variants.*.sku' => ['required_with:variants', 'string', 'max:100', Rule::unique('product_varients', 'sku')],
            'variants.*.barcode' => ['nullable', 'string', 'regex:/^\d{12}$/', Rule::unique('product_varients', 'barcode')],
            'variants.*.cost_price' => ['required_with:variants', 'numeric', 'min:0'],
            'variants.*.selling_price' => ['required_with:variants', 'numeric', 'min:0'],
            'variants.*.status' => ['required_with:variants', Rule::in(['active', 'inactive'])],
            'variants.*.attribute_values' => ['nullable', 'array'],
            'variants.*.attribute_values.*.attribute_id' => ['required_with:variants.*.attribute_values', 'integer', 'exists:attributes,id'],
            'variants.*.attribute_values.*.value' => ['required_with:variants.*.attribute_values', 'string', 'max:255'],
        ];

        if ($type === 'simple') {
            return array_merge($rules, [
                'sku' => ['required', 'string', 'max:100', Rule::unique('product_varients', 'sku')],
                'barcode' => ['nullable', 'string', 'regex:/^\d{12}$/', Rule::unique('product_varients', 'barcode')],
                'purchase_price' => ['required', 'numeric', 'min:0'],
                'sale_price' => ['required', 'numeric', 'min:0'],
            ]);
        }

        return $rules;
    }
}
