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
        Schema::create('product_varient_attributes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_varient_id')
                ->constrained('product_varients')
                ->cascadeOnDelete();
            $table->foreignId('attribute_id')
                ->constrained('attributes')
                ->cascadeOnDelete();
            $table->foreignId('attribute_value_id')
                ->constrained('attribute_values')
                ->cascadeOnDelete();

            // Each variant should have only one value per attribute (e.g. one Color).
            $table->unique(['product_varient_id', 'attribute_id'], 'pva_var_attr_unique');
            $table->index(['product_varient_id', 'attribute_value_id'], 'pva_var_val_index');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_varient_attributes');
    }
};
