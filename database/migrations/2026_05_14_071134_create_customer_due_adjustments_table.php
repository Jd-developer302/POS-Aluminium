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
        Schema::create('customer_due_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')
                ->constrained('branches')
                ->restrictOnDelete();
            $table->foreignId('customer_id')
                ->constrained('customers')
                ->restrictOnDelete();
            $table->foreignId('customer_due_item_id')
                ->constrained('customer_due_items')
                ->restrictOnDelete();
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->date('adjustment_date');
            $table->enum('adjustment_type', [
                'discount',
                'write_off',
                'correction',
            ])->default('discount')->index();
            $table->decimal('amount', 15, 2)->default(0);
            $table->text('reason')->nullable();
            $table->timestamps();
            $table->index(['branch_id', 'customer_id']);
            $table->index(['customer_due_item_id']);
            $table->index(['adjustment_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_due_adjustments');
    }
};
