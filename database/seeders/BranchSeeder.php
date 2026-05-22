<?php

namespace Database\Seeders;

use App\Models\Company\Branch;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        $branches = [
            [
                'name' => 'Main Branch',
                'address' => '123 Business Road, City',
                'phone' => '+923001111111',
                'email' => 'main@techlape.local',
                'website' => null,
                'status' => 'active',
            ],
            [
                'name' => 'North Outlet',
                'address' => '456 Mall Avenue, City',
                'phone' => '+923002222222',
                'email' => 'north@techlape.local',
                'website' => null,
                'status' => 'active',
            ],
        ];

        foreach ($branches as $data) {
            Branch::firstOrCreate(
                ['name' => $data['name']],
                $data
            );
        }
    }
}
