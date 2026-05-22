<?php

namespace App\Policies;

use App\Models\Product\SubCategory;
use App\Models\User;

class SubCategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('sub_categories.view');
    }

    public function view(User $user, SubCategory $subCategory): bool
    {
        return $user->can('sub_categories.view');
    }

    public function create(User $user): bool
    {
        return $user->can('sub_categories.create');
    }

    public function update(User $user, SubCategory $subCategory): bool
    {
        return $user->can('sub_categories.edit');
    }

    public function delete(User $user, SubCategory $subCategory): bool
    {
        return $user->can('sub_categories.delete');
    }
}
