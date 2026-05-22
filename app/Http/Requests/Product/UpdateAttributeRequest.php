<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAttributeRequest extends FormRequest
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
        $attribute = $this->route('attribute');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('attributes', 'name')->ignore($attribute?->id),
            ],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
