<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Safe when payrolls was already created from an older create_payrolls migration
 * without payment_mode. Skip if the column already exists (e.g. after migrate:fresh on full file).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('payrolls') && ! Schema::hasColumn('payrolls', 'payment_mode')) {
            Schema::table('payrolls', function (Blueprint $table) {
                $table->enum('payment_mode', ['cash', 'bank', 'cheque'])->nullable()->after('payment_date');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('payrolls') && Schema::hasColumn('payrolls', 'payment_mode')) {
            Schema::table('payrolls', function (Blueprint $table) {
                $table->dropColumn('payment_mode');
            });
        }
    }
};
