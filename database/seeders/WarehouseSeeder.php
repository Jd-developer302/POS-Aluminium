<?php

namespace Database\Seeders;

use App\Models\Company\Branch;
use App\Models\Company\Warehouse;
use Illuminate\Database\Seeder;

class WarehouseSeeder extends Seeder
{
    public function run(): void
    {
        $main = Branch::query()->where('name', 'Main Branch')->first();
        $north = Branch::query()->where('name', 'North Outlet')->first();

        if ($main) {
            Warehouse::firstOrCreate(
                ['code' => 'WH-MAIN-01'],
                [
                    'branch_id' => $main->id,
                    'name' => 'Main Store',
                    'address' => $main->address,
                    'phone' => $main->phone,
                    'is_default' => true,
                    'status' => 'active',
                ]
            );
        }

        if ($north) {
            Warehouse::firstOrCreate(
                ['code' => 'WH-NORTH-01'],
                [
                    'branch_id' => $north->id,
                    'name' => 'North Stock',
                    'address' => $north->address,
                    'phone' => $north->phone,
                    'is_default' => true,
                    'status' => 'active',
                ]
            );
        }
    }
}
