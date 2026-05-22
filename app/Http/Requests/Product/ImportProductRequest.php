<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class ImportProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('products.create') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'add_for_sync' => $this->boolean('add_for_sync'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
            'add_for_sync' => ['sometimes', 'boolean'],
        ];
    }
}
