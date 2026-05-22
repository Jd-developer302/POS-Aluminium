<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBrandRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('brands.edit') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $merge = [];

        if (! $this->hasFile('logo')) {
            $merge['logo'] = $this->input('logo') === '' ? null : $this->input('logo');
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
        return [
            'name' => ['required', 'string', 'max:255'],
            'logo' => ['nullable', 'file', 'mimes:jpeg,jpg,png,gif,webp,svg', 'max:2048'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
