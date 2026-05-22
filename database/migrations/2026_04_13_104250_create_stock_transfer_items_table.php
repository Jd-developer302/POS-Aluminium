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
        Schema::create('stock_transfer_items', function (Blueprint $table) {
            $table->id();

            $table
                ->foreignId('stock_transfer_id')
                ->constrained('stock_transfers')
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
            $table->decimal('received_quantity', 15, 4)->default(0);
            $table->text('notes')->nullable();

            $table->softDeletes();
            $table->timestamps();

            $table->index(['stock_transfer_id']);
            $table->index(['product_id', 'product_variant_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_transfer_items');
    }
};
