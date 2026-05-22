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
        Schema::create('customer_receipt_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_receipt_id')
                ->constrained('customer_receipts')
                ->cascadeOnDelete();
            $table->foreignId('customer_due_item_id')
                ->constrained('customer_due_items')
                ->restrictOnDelete();
            $table->decimal('amount', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(
                ['customer_receipt_id', 'customer_due_item_id'],
                'customer_receipt_allocations_receipt_due_unique'
            );
            $table->index(['customer_due_item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_receipt_allocations');
    }
};
