<?php

namespace App\Http\Requests\User;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Validator;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('settings.users') ?? false;
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('branch_id') === '' || $this->input('branch_id') === null) {
            $this->merge(['branch_id' => null]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique(User::class, 'email')],
            'phone' => ['nullable', 'string', 'max:40'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['string', Rule::exists('roles', 'name')->where('guard_name', 'web')],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $roles = $this->input('roles', []);
            if (! in_array('Super Admin', $roles, true) && blank($this->input('branch_id'))) {
                $validator->errors()->add(
                    'branch_id',
                    'A branch is required unless the user is Super Admin.',
                );
            }
        });
    }
}
