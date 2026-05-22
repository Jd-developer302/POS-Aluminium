<?php

namespace App\Policies;

use App\Models\Company\Branch;
use App\Models\User;

class BranchPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('branches.view');
    }

    public function view(User $user, Branch $branch): bool
    {
        return $user->can('branches.view');
    }

    public function create(User $user): bool
    {
        return $user->can('branches.create');
    }

    public function update(User $user, Branch $branch): bool
    {
        return $user->can('branches.edit');
    }

    public function delete(User $user, Branch $branch): bool
    {
        return $user->can('branches.delete');
    }
}
