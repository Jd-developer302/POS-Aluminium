<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Lines mirror sale_items: quantity mode uses quantity × unit_price;
     * length_ft mode uses length_pairs JSON + quantity = total ft, unit_price = rate/ft (same as Sale).
     */
    public function up(): void
    {
        Schema::create('quotation_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('quotation_id')->constrained('quotations')->cascadeOnDelete();
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

            $table->string('billing_mode', 20)->default('quantity');
            $table->json('length_pairs')->nullable();

            $table->decimal('quantity', 15, 4)->default(0);
            $table->decimal('unit_price', 15, 2)->default(0);

            $table->decimal('tax_rate', 8, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);

            $table->enum('discount_type', ['fixed', 'percent'])->nullable();
            $table->decimal('discount_value', 15, 4)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);

            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('line_total', 15, 2)->default(0);

            $table->text('notes')->nullable();

            $table->softDeletes();
            $table->timestamps();

            $table->index(['quotation_id']);
            $table->index(['product_id', 'product_variant_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotation_items');
    }
};
