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
        Schema::create('customer_receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')
                ->constrained('branches')
                ->restrictOnDelete();
            $table->foreignId('customer_id')
                ->constrained('customers')
                ->restrictOnDelete();
            $table->foreignId('received_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('receipt_no');
            $table->date('receipt_date');
            $table->enum('receipt_type', [
                'recovery',
                'sale_payment',
                'advance',
            ])->default('recovery')->index();
            $table->decimal('amount', 15, 2)->default(0);
            $table->decimal('allocated_amount', 15, 2)->default(0);
            $table->decimal('unallocated_amount', 15, 2)->default(0);
            $table->string('payment_method', 50)->default('cash');
            $table->string('payment_reference')->nullable();
            $table->enum('status', ['posted', 'cancelled'])
                ->default('posted')
                ->index();
            $table->text('notes')->nullable();
            $table->softDeletes();
            $table->timestamps();
            $table->unique(['branch_id', 'receipt_no'], 'customer_receipts_branch_receipt_no_unique');
            $table->index(['branch_id', 'customer_id']);
            $table->index(['customer_id', 'receipt_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_receipts');
    }
};
