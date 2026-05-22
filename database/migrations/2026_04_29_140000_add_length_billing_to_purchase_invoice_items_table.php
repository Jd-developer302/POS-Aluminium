<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_invoice_items', function (Blueprint $table) {
            $table->string('billing_mode', 20)->default('quantity')->after('product_batch_id');
            $table->json('length_pairs')->nullable()->after('billing_mode');
        });
    }

    public function down(): void
    {
        Schema::table('purchase_invoice_items', function (Blueprint $table) {
            $table->dropColumn(['billing_mode', 'length_pairs']);
        });
    }
};
