<?php

namespace App\Policies;

use App\Models\Product\Taxes;
use App\Models\User;

class TaxPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('taxes.view') || $user->can('settings.taxes');
    }

    public function view(User $user, Taxes $tax): bool
    {
        return $user->can('taxes.view') || $user->can('settings.taxes');
    }

    public function create(User $user): bool
    {
        return $user->can('taxes.create') || $user->can('settings.taxes');
    }

    public function update(User $user, Taxes $tax): bool
    {
        return $user->can('taxes.edit') || $user->can('settings.taxes');
    }

    public function delete(User $user, Taxes $tax): bool
    {
        return $user->can('taxes.delete') || $user->can('settings.taxes');
    }
}
