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
        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained('warehouses')->restrictOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->restrictOnDelete();
            $table
                ->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->date('adjustment_date');
            $table->string('reference_number');
            $table->enum('type', [
                'increase',
                'decrease',
                'damage',
                'wastage',
                'manual',
            ]);
            $table->text('reason')->nullable();
            $table
                ->enum('status', ['draft', 'completed', 'cancelled'])
                ->default('draft');
            $table->decimal('total_quantity', 15, 4)->default(0);
            $table->softDeletes();
            $table->timestamps();

            $table->unique(
                ['branch_id', 'reference_number'],
                'stock_adj_branch_ref_unique',
            );
            $table->index(['warehouse_id', 'status']);
            $table->index(['branch_id', 'adjustment_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_adjustments');
    }
};
