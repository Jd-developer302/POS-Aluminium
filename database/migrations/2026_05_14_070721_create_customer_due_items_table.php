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
        Schema::create('customer_due_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')
                ->constrained('branches')
                ->restrictOnDelete();
            $table->foreignId('customer_id')
                ->constrained('customers')
                ->restrictOnDelete();
            $table->enum('source_type', ['old_balance', 'sale', 'manual'])
                ->default('old_balance')
                ->index();
            $table->foreignId('sale_id')
                ->nullable()
                ->constrained('sales')
                ->nullOnDelete();
            $table->foreignId('product_id')
                ->nullable()
                ->constrained('products')
                ->nullOnDelete();
            $table->foreignId('product_variant_id')
                ->nullable()
                ->constrained('product_varients')
                ->nullOnDelete();
            $table->string('product_name')->nullable();
            $table->string('variant_name')->nullable();
            $table->string('reference_no')->nullable();
            $table->date('transaction_date');
            $table->date('due_date')->nullable();
            $table->decimal('original_amount', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('adjusted_amount', 15, 2)->default(0);
            $table->decimal('balance_amount', 15, 2)->default(0);
            $table->enum('status', [
                'unpaid',
                'partial',
                'paid',
                'written_off',
                'cancelled',
            ])->default('unpaid')->index();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();
            $table->index(['branch_id', 'customer_id']);
            $table->index(['customer_id', 'status']);
            $table->index(['transaction_date']);
            $table->index(['due_date']);
            $table->index(['sale_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_due_items');
    }
};
