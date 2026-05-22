<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement('
            UPDATE sales s
            SET discount_amount = (
                SELECT COALESCE(SUM(si.discount), 0)
                FROM sale_items si
                WHERE si.sale_id = s.id
            )
            WHERE s.discount_amount = 0
              AND EXISTS (
                SELECT 1
                FROM sale_items si2
                WHERE si2.sale_id = s.id AND si2.discount > 0
              )
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Non-destructive: cannot distinguish backfilled vs intentional zero discounts.
    }
};
