<?php

namespace App\Http\Requests\Branch;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWarehouseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('warehouses.edit') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'address' => $this->input('address') === '' ? null : $this->input('address'),
            'phone' => $this->input('phone') === '' ? null : $this->input('phone'),
            'is_default' => $this->boolean('is_default'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $warehouse = $this->route('warehouse');

        return [
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('warehouses', 'code')->ignore($warehouse->id)],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:50'],
            'is_default' => ['boolean'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
