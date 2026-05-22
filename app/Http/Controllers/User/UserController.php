<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\Company\Branch;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class UserController extends Controller
{
    public function index(): Response
    {
        $users = User::query()
            ->with(['roles', 'branch'])
            ->orderBy('name')
            ->paginate(15)
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'branch' => $user->branch?->name,
                'roles' => $user->roles->pluck('name')->values()->all(),
            ]);

        return Inertia::render('User/Index', [
            'users' => $users,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('User/Create', [
            'roles' => $this->rolesForForm(),
            'branches' => $this->branchesForForm(),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $roles = $data['roles'];
        unset($data['roles']);

        $user = User::create([
            ...$data,
            'email_verified_at' => now(),
        ]);

        $user->syncRoles($roles);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return redirect()->route('users.show', $user)
            ->with('success', 'User created.');
    }

    public function show(User $user): Response
    {
        $user->load(['roles' => fn ($q) => $q->orderBy('name'), 'branch']);

        return Inertia::render('User/Show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'branch' => $user->branch?->name,
                'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                'roles' => $user->roles->pluck('name')->values()->all(),
            ],
        ]);
    }

    public function edit(User $user): Response
    {
        $user->load(['roles']);

        return Inertia::render('User/Edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'branch_id' => $user->branch_id,
                'roles' => $user->roles->pluck('name')->values()->all(),
            ],
            'roles' => $this->rolesForForm(),
            'branches' => $this->branchesForForm(),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();
        $roles = $data['roles'];
        unset($data['roles']);

        if (empty($data['password'])) {
            unset($data['password']);
        }

        if ($user->email !== $data['email']) {
            $data['email_verified_at'] = null;
        }

        $user->update($data);
        $user->syncRoles($roles);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return redirect()->route('users.show', $user)
            ->with('success', 'User updated.');
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === request()->user()?->id) {
            return redirect()->route('users.index')
                ->with('error', 'You cannot delete your own account from here.');
        }

        $user->syncRoles([]);

        $user->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return redirect()->route('users.index')
            ->with('success', 'User deleted.');
    }

    /**
     * @return list<array{name: string}>
     */
    private function rolesForForm(): array
    {
        return Role::query()
            ->where('guard_name', 'web')
            ->orderBy('name')
            ->get(['name'])
            ->map(fn (Role $role) => ['name' => $role->name])
            ->values()
            ->all();
    }

    /**
     * @return list<array{id: int, name: string}>
     */
    private function branchesForForm(): array
    {
        return Branch::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Branch $branch) => ['id' => $branch->id, 'name' => $branch->name])
            ->values()
            ->all();
    }
}
