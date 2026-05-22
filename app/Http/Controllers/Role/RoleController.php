<?php

namespace App\Http\Controllers\Role;

use App\Http\Controllers\Controller;
use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleController extends Controller
{
    public function index(): Response
    {
        $roles = Role::query()
            ->where('guard_name', 'web')
            ->withCount(['permissions', 'users'])
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Role/Index', [
            'roles' => $roles,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Role/Create', [
            'permissions' => Permission::query()
                ->where('guard_name', 'web')
                ->orderBy('name')
                ->pluck('name'),
        ]);
    }

    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $role = Role::create([
            'name' => $request->validated('name'),
            'guard_name' => 'web',
        ]);

        $role->syncPermissions($request->validated('permissions', []));

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return redirect()->route('roles.show', $role)
            ->with('success', 'Role created.');
    }

    public function show(Role $role): Response
    {
        $this->ensureWebGuard($role);

        $role->load(['permissions' => fn ($q) => $q->orderBy('name')]);

        return Inertia::render('Role/Show', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name')->values(),
            ],
        ]);
    }

    public function edit(Role $role): Response
    {
        $this->ensureWebGuard($role);

        $role->load(['permissions']);

        return Inertia::render('Role/Edit', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name')->values(),
            ],
            'permissions' => Permission::query()
                ->where('guard_name', 'web')
                ->orderBy('name')
                ->pluck('name'),
        ]);
    }

    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        $this->ensureWebGuard($role);

        $role->update(['name' => $request->validated('name')]);
        $role->syncPermissions($request->validated('permissions', []));

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return redirect()->route('roles.show', $role)
            ->with('success', 'Role updated.');
    }

    public function destroy(Role $role): RedirectResponse
    {
        $this->ensureWebGuard($role);

        if ($role->users()->exists()) {
            return redirect()->route('roles.index')
                ->with('error', 'Cannot delete a role that is assigned to users.');
        }

        $role->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return redirect()->route('roles.index')
            ->with('success', 'Role deleted.');
    }

    private function ensureWebGuard(Role $role): void
    {
        if ($role->guard_name !== 'web') {
            abort(404);
        }
    }
}
