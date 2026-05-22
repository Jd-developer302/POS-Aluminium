<?php

namespace App\Http\Requests\Product;

use App\Models\Product\Product;
use App\Models\Product\ProductVarient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('products.edit') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $merge = [];

        if (! $this->hasFile('image')) {
            $merge['image'] = $this->input('image') === '' ? null : $this->input('image');
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
        /** @var Product $product */
        $product = $this->route('product');
        $categoryId = (int) $this->input('category_id');

        $base = [
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
        ];

        if ($product->type === 'variable') {
            return array_merge($base, [
                'variants' => ['required', 'array', 'min:1'],
                'variants.*.id' => [
                    'required',
                    'integer',
                    Rule::exists('product_varients', 'id')->where(
                        fn ($q) => $q->where('product_id', $product->id),
                    ),
                ],
                'variants.*.name' => ['required', 'string', 'max:255'],
                'variants.*.sku' => ['required', 'string', 'max:100'],
                'variants.*.barcode' => ['nullable', 'string', 'regex:/^\d{12}$/'],
                'variants.*.cost_price' => ['required', 'numeric', 'min:0'],
                'variants.*.selling_price' => ['required', 'numeric', 'min:0'],
                'variants.*.status' => ['required', Rule::in(['active', 'inactive'])],
                'variants.*.attribute_values' => ['nullable', 'array'],
                'variants.*.attribute_values.*.attribute_id' => ['nullable', 'integer', 'exists:attributes,id'],
                'variants.*.attribute_values.*.value' => ['nullable', 'string', 'max:255'],
            ]);
        }

        $variant = $product->varients()->orderBy('id')->first();
        $variantId = $variant?->id;

        return array_merge($base, [
            'sku' => [
                'required',
                'string',
                'max:100',
                Rule::unique('product_varients', 'sku')->ignore($variantId),
            ],
            'barcode' => [
                'nullable',
                'string',
                'regex:/^\d{12}$/',
                Rule::unique('product_varients', 'barcode')->ignore($variantId),
            ],
            'purchase_price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['required', 'numeric', 'min:0'],
        ]);
    }

    public function withValidator(Validator $validator): void
    {
        /** @var Product $product */
        $product = $this->route('product');
        if ($product->type !== 'variable') {
            return;
        }

        $validator->after(function (Validator $v): void {
            $rows = $this->input('variants', []);
            foreach ($rows as $i => $row) {
                $id = isset($row['id']) ? (int) $row['id'] : null;
                $sku = (string) ($row['sku'] ?? '');
                if ($id === null || $sku === '') {
                    continue;
                }
                $skuConflict = ProductVarient::query()
                    ->where('sku', $sku)
                    ->where('id', '!=', $id)
                    ->exists();
                if ($skuConflict) {
                    $v->errors()->add("variants.$i.sku", 'This SKU is already taken.');
                }

                $barcode = $row['barcode'] ?? null;
                if (is_string($barcode) && preg_match('/^\d{12}$/', $barcode) === 1) {
                    $barcodeConflict = ProductVarient::query()
                        ->where('barcode', $barcode)
                        ->where('id', '!=', $id)
                        ->exists();
                    if ($barcodeConflict) {
                        $v->errors()->add("variants.$i.barcode", 'This barcode is already used.');
                    }
                }
            }
        });
    }
}
