<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $all = Permission::query()->pluck('name')->all();

        $branchManager = [
            'dashboard.view',
            'products.view', 'products.create', 'products.edit', 'products.delete', 'products.barcode', 'products.import', 'products.export',
            'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
            'sub_categories.view', 'sub_categories.create', 'sub_categories.edit', 'sub_categories.delete',
            'brands.view', 'brands.create', 'brands.edit', 'brands.delete',
            'taxes.view', 'taxes.create', 'taxes.edit', 'taxes.delete',
            'units.view', 'units.create', 'units.edit', 'units.delete',
            'pos.view', 'pos.create', 'pos.return',
            'sales.view', 'sales.create', 'sales.edit', 'sales.delete', 'sales.return', 'sales.receipt',
            'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
            'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete',
            'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.delete', 'purchases.return',
            'inventory.view', 'inventory.adjust', 'inventory.transfer', 'inventory.movement',
            'warehouses.view', 'warehouses.create', 'warehouses.edit', 'warehouses.delete',
            'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.payment',
            'reports.view', 'reports.sales', 'reports.purchases', 'reports.inventory',
            'settings.view', 'settings.taxes', 'settings.payment_methods',
            'branches.view', 'branches.create', 'branches.edit', 'branches.delete',
        ];

        $cashier = [
            'dashboard.view',
            'products.view',
            'categories.view',
            'sub_categories.view',
            'brands.view',
            'taxes.view',
            'units.view',
            'pos.view', 'pos.create', 'pos.return',
            'sales.view', 'sales.create', 'sales.receipt',
            'customers.view', 'customers.create', 'customers.edit',
            'reports.view', 'reports.sales',
        ];

        $roles = [
            'Super Admin' => $all,
            'Branch Manager' => $branchManager,
            'Cashier' => $cashier,
        ];

        foreach ($roles as $name => $permissionNames) {
            $role = Role::firstOrCreate([
                'name' => $name,
                'guard_name' => 'web',
            ]);
            $role->syncPermissions($permissionNames);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
