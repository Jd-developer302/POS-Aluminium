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
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->id();

            $table->foreignId('from_branch_id')->constrained('branches')->restrictOnDelete();
            $table->foreignId('to_branch_id')->constrained('branches')->restrictOnDelete();

            $table->foreignId('from_warehouse_id')->constrained('warehouses')->restrictOnDelete();
            $table->foreignId('to_warehouse_id')->constrained('warehouses')->restrictOnDelete();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();

            $table->date('transfer_date');
            $table->string('reference_number');
            $table->text('notes')->nullable();

            $table
                ->enum('status', ['draft', 'in_transit', 'completed', 'cancelled'])
                ->default('draft')
                ->index();

            $table->decimal('total_quantity', 15, 4)->default(0);

            $table->softDeletes();
            $table->timestamps();

            $table->unique(
                ['from_branch_id', 'reference_number'],
                'stock_transfer_from_ref_unique',
            );
            $table->index(['from_branch_id', 'transfer_date']);
            $table->index(['to_branch_id', 'transfer_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_transfers');
    }
};
