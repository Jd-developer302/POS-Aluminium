<?php

namespace Database\Seeders;

use App\Models\Supplier\Customer;
use App\Models\Supplier\Supplier;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CustomerSupplierSeeder extends Seeder
{
    public function run(): void
    {
        Customer::firstOrCreate(
            ['code' => 'CUST-WALKIN'],
            [
                'name' => 'Walk-in Customer',
                'email' => null,
                'phone' => null,
                'status' => 'active',
            ]
        );

        Customer::firstOrCreate(
            ['code' => 'CUST-001'],
            [
                'name' => 'Sample Retail Customer',
                'email' => 'customer@example.com',
                'phone' => '+923003333333',
                'city' => 'Karachi',
                'country' => 'Pakistan',
                'status' => 'active',
            ]
        );

        Supplier::firstOrCreate(
            ['code' => 'SUP-001'],
            [
                'name' => 'Sample Wholesale Supplier',
                'slug' => Str::slug('Sample Wholesale Supplier').'-sup-001',
                'email' => 'supplier@example.com',
                'phone' => '+923004444444',
                'city' => 'Lahore',
                'country' => 'Pakistan',
                'status' => 'active',
            ]
        );
    }
}
