<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAttributeValueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $attributeId = (int) $this->input('attribute_id');
        $attributeValue = $this->route('attribute_value');

        return [
            'attribute_id' => ['required', 'integer', 'exists:attributes,id'],
            'value' => [
                'required',
                'string',
                'max:255',
                Rule::unique('attribute_values', 'value')
                    ->ignore($attributeValue?->id)
                    ->where(fn ($q) => $q->where('attribute_id', $attributeId)),
            ],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
