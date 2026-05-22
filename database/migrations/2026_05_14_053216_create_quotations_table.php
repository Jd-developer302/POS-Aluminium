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
        Schema::create('quotations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('branch_id')->constrained('branches')->restrictOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->restrictOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->string('quotation_no');
            $table->date('quotation_date');
            $table->date('valid_until')->nullable();

            $table
                ->enum('status', ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'])
                ->default('draft')
                ->index();

            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('discount_value', 15, 4)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('shipping_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);

            $table->text('notes')->nullable();

            $table->foreignId('converted_sale_id')->nullable()->constrained('sales')->nullOnDelete();

            $table->softDeletes();
            $table->timestamps();

            $table->unique(['branch_id', 'quotation_no'], 'quotations_branch_quotation_no_unique');
            $table->index(['branch_id', 'quotation_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotations');
    }
};
