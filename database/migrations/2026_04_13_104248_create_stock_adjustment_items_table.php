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
        Schema::create('stock_adjustment_items', function (Blueprint $table) {
            $table->id();
            $table
                ->foreignId('stock_adjustment_id')
                ->constrained('stock_adjustments')
                ->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table
                ->foreignId('product_variant_id')
                ->nullable()
                ->constrained('product_varients')
                ->nullOnDelete();
            $table
                ->foreignId('product_batch_id')
                ->nullable()
                ->constrained('product_batches')
                ->nullOnDelete();
            $table->decimal('quantity', 15, 4);
            $table->decimal('before_qty', 15, 4)->default(0);
            $table->decimal('after_qty', 15, 4)->default(0);
            $table->decimal('purchase_price', 12, 2)->nullable();
            $table->decimal('selling_price', 12, 2)->nullable();
            $table->date('expiry_date')->nullable();
            $table->text('notes')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->unique(
                [
                    'stock_adjustment_id',
                    'product_id',
                    'product_variant_id',
                    'product_batch_id',
                ],
                'stock_adjustment_item_unique',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_adjustment_items');
    }
};
