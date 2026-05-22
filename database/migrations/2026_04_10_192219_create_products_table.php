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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->foreignId('sub_category_id')->constrained()->onDelete('cascade');
            $table->foreignId('brand_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('unit_id')->constrained()->onDelete('cascade');
            $table->foreignId('tax_id')->nullable()->constrained()->onDelete('set null');
            $table->string('name');
            $table->string('slug')->unique();
            // Pricing
            $table->enum('type', ['simple', 'variable'])->default('simple');
            $table->enum('sale_type', ['quantity', 'weight'])->default('quantity');

            // Stock Packaging
            $table->integer('quantity_in_pack')->default(1);
            $table->integer('pack_in_carton')->default(1);
            $table->string('image')->nullable();
            $table->text('description')->nullable();

            // Inventory Alerts
            $table->boolean('alert')->default(false);
            $table->text('alert_message')->nullable();
            $table->integer('expiry_alert')->nullable(); // days before expiry
            $table->integer('quantity_alert')->nullable(); // low stock alert
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
