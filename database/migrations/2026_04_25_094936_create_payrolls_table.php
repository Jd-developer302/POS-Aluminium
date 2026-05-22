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
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();

            $table->tinyInteger('month'); // 1-12
            $table->year('year');

            $table->decimal('basic_salary', 12, 2);
            $table->decimal('total_allowance', 12, 2)->default(0);
            $table->decimal('total_deduction', 12, 2)->default(0);

            $table->decimal('net_salary', 12, 2);

            $table->enum('status', ['unpaid', 'processed', 'paid'])->default('unpaid');

            $table->date('payment_date')->nullable();
            $table->enum('payment_mode', ['cash', 'bank', 'cheque'])->nullable();

            $table->json('attendance_snapshot')->nullable();
            $table->timestamp('attendance_synced_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unique(['employee_id', 'month', 'year']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};
