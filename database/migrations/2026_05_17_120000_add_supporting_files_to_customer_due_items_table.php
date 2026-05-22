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
        Schema::table('customer_due_items', function (Blueprint $table) {
            $table->string('supporting_image_path', 512)->nullable()->after('notes');
            $table->string('supporting_pdf_path', 512)->nullable()->after('supporting_image_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_due_items', function (Blueprint $table) {
            $table->dropColumn(['supporting_image_path', 'supporting_pdf_path']);
        });
    }
};
