<?php

namespace App\Http\Requests\Branch;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('branches.edit') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $merge = [
            'phone' => $this->input('phone') === '' ? null : $this->input('phone'),
            'email' => $this->input('email') === '' ? null : $this->input('email'),
            'website' => $this->input('website') === '' ? null : $this->input('website'),
            'address' => $this->input('address') === '' ? null : $this->input('address'),
        ];

        if (! $this->hasFile('logo')) {
            $merge['logo'] = $this->input('logo') === '' ? null : $this->input('logo');
        }

        $this->merge($merge);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $branch = $this->route('branch');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('branches', 'name')->ignore($branch->id)],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:20', Rule::unique('branches', 'phone')->ignore($branch->id)],
            'email' => ['nullable', 'string', 'lowercase', 'email', 'max:255', Rule::unique('branches', 'email')->ignore($branch->id)],
            'website' => ['nullable', 'string', 'max:255'],
            'logo' => ['nullable', 'image', 'mimes:jpeg,jpg,png,gif,webp', 'max:2048'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
