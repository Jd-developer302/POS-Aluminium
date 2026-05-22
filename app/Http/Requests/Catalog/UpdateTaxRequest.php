<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaxRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user && ($user->can('taxes.edit') || $user->can('settings.taxes'));
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('code')) {
            $this->merge([
                'code' => strtoupper(trim((string) $this->input('code', ''))),
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $tax = $this->route('tax');

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('taxes', 'code')->ignore($tax?->id),
            ],
            'rate' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'type' => ['required', Rule::in(['percentage', 'fixed'])],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
