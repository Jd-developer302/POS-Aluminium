<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('purchase_orders')->where('status', 'ordered')->update(['status' => 'sent']);

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE purchase_orders MODIFY COLUMN status ENUM('pending','sent','partial','received','cancelled') NOT NULL DEFAULT 'pending'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('purchase_orders')->where('status', 'sent')->update(['status' => 'ordered']);

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE purchase_orders MODIFY COLUMN status ENUM('pending','ordered','partial','received','cancelled') NOT NULL DEFAULT 'pending'");
        }
    }
};
