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
        Schema::create('purchase_invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_invoice_id')->constrained('purchase_invoices')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->foreignId('product_variant_id')->nullable()->constrained('product_varients')->onDelete('set null');
            $table->foreignId('product_batch_id')->nullable()->constrained('product_batches')->onDelete('set null');
            $table->decimal('quantity', 15, 4)->default(0);
            $table->decimal('unit_cost', 12, 2)->default(0);
            $table->decimal('tax_rate', 8, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->softDeletes();
            $table->timestamps();
            $table->unique(['purchase_invoice_id', 'product_id', 'product_variant_id', 'product_batch_id'], 'purchase_invoice_item_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_invoice_items');
    }
};
