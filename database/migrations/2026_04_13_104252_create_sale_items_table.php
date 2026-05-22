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
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();
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

            $table->decimal('quantity', 15, 4)->default(0);
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->decimal('tax_rate', 8, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('subtotal', 12, 2)->default(0);

            $table->text('notes')->nullable();

            $table->softDeletes();
            $table->timestamps();

            $table->index(['sale_id']);
            $table->index(['product_id', 'product_variant_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};
