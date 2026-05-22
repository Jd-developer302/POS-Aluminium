<?php

namespace Database\Seeders;

use App\Models\Company\Branch;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('password');

        $mainBranch = Branch::query()->where('name', 'Main Branch')->first();
        $northBranch = Branch::query()->where('name', 'North Outlet')->first();

        $superAdmin = User::updateOrCreate(
            ['email' => 'admin@techlape.local'],
            [
                'name' => 'Super Admin',
                'password' => $password,
                'branch_id' => null,
            ]
        );
        $superAdmin->forceFill(['email_verified_at' => now()])->save();
        $superAdmin->syncRoles(['Super Admin']);

        if ($mainBranch) {
            $manager = User::updateOrCreate(
                ['email' => 'manager@techlape.local'],
                [
                    'name' => 'Main Branch Manager',
                    'password' => $password,
                    'branch_id' => $mainBranch->id,
                ]
            );
            $manager->forceFill(['email_verified_at' => now()])->save();
            $manager->syncRoles(['Branch Manager']);
        }

        if ($northBranch) {
            $cashier = User::updateOrCreate(
                ['email' => 'cashier@techlape.local'],
                [
                    'name' => 'North Cashier',
                    'password' => $password,
                    'branch_id' => $northBranch->id,
                ]
            );
            $cashier->forceFill(['email_verified_at' => now()])->save();
            $cashier->syncRoles(['Cashier']);
        }
    }
}
