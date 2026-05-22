<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('branch_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table
                ->foreignId('product_variant_id')
                ->nullable()
                ->constrained('product_varients')
                ->nullOnDelete();
            $table->decimal('stock_qty', 15, 4)->default(0);
            $table->decimal('reserved_qty', 15, 4)->default(0);
            $table->decimal('min_stock_level', 15, 4)->nullable();
            $table->decimal('max_stock_level', 15, 4)->nullable();
            $table->timestamps();

            $table->unique(
                ['branch_id', 'product_id', 'product_variant_id'],
                'branch_products_unique',
            );
            $table->index(['branch_id', 'product_id', 'product_variant_id']);
            $table->index(['branch_id', 'stock_qty']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branch_products');
    }
};
