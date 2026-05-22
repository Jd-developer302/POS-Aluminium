<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Physical rods / offcuts per stock row (cut-length inventory).
     * Summary {@see Stock::$quantity} for length_ft should equal sum(length × qty).
     */
    public function up(): void
    {
        Schema::create('stock_length_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_id')
                ->constrained('stocks')
                ->cascadeOnDelete();
            $table->decimal('length', 15, 4);
            $table->decimal('qty', 15, 4)->default(0);
            $table
                ->enum('status', ['available', 'reserved', 'scrapped'])
                ->default('available')
                ->index();
            $table->timestamps();

            $table->index(['stock_id', 'status', 'length'], 'stock_length_items_stock_status_length_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_length_items');
    }
};
