<?php

namespace App\Actions\Auth;

use App\Models\Company\Branch;
use App\Models\User;

class EstablishBranchSession
{
    public function __invoke(User $user): void
    {
        if ($user->hasRole('Super Admin')) {
            // Prefer explicit assignment when Super Admin has a branch selected.
            if ($user->branch_id) {
                $ok = Branch::query()
                    ->whereKey($user->branch_id)
                    ->where('status', 'active')
                    ->exists();

                if ($ok) {
                    session(['current_branch_id' => $user->branch_id]);

                    return;
                }
            }

            $branch = Branch::query()
                ->where('status', 'active')
                ->orderBy('id')
                ->first();

            session(['current_branch_id' => $branch?->id]);

            return;
        }

        if ($user->branch_id) {
            $ok = Branch::query()
                ->whereKey($user->branch_id)
                ->where('status', 'active')
                ->exists();
            session(['current_branch_id' => $ok ? $user->branch_id : null]);

            return;
        }

        session(['current_branch_id' => null]);
    }
}
