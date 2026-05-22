<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            'dashboard.view',
            'products.view',
            'products.create',
            'products.edit',
            'products.delete',
            'products.barcode',
            'products.import',
            'products.export',
            'categories.view',
            'categories.create',
            'categories.edit',
            'categories.delete',
            'sub_categories.view',
            'sub_categories.create',
            'sub_categories.edit',
            'sub_categories.delete',
            'brands.view',
            'brands.create',
            'brands.edit',
            'brands.delete',
            'units.view',
            'units.create',
            'units.edit',
            'units.delete',
            'pos.view',
            'pos.create',
            'pos.return',
            'sales.view',
            'sales.create',
            'sales.edit',
            'sales.delete',
            'sales.return',
            'sales.receipt',
            'customers.view',
            'customers.create',
            'customers.edit',
            'customers.delete',
            'suppliers.view',
            'suppliers.create',
            'suppliers.edit',
            'suppliers.delete',
            'purchases.view',
            'purchases.create',
            'purchases.edit',
            'purchases.delete',
            'purchases.return',
            'inventory.view',
            'inventory.adjust',
            'inventory.transfer',
            'inventory.movement',
            'warehouses.view',
            'warehouses.create',
            'warehouses.edit',
            'warehouses.delete',
            'invoices.view',
            'invoices.create',
            'invoices.edit',
            'invoices.delete',
            'invoices.payment',
            'accounting.view',
            'accounting.transactions',
            'accounting.journals',
            'accounting.expenses',
            'accounting.reports',
            'hrm.view',
            'hrm.employees',
            'hrm.attendances',
            'hrm.leaves',
            'hrm.payroll',
            'crm.view',
            'crm.leads',
            'crm.deals',
            'crm.tickets',
            'reports.view',
            'reports.sales',
            'reports.purchases',
            'reports.inventory',
            'reports.financial',
            'settings.view',
            'settings.users',
            'settings.roles',
            'settings.permissions',
            'settings.taxes',
            'taxes.view',
            'taxes.create',
            'taxes.edit',
            'taxes.delete',
            'settings.payment_methods',
            'branches.view',
            'branches.create',
            'branches.edit',
            'branches.delete',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }
    }
}
