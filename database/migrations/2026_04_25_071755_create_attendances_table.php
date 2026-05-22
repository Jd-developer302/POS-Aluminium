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
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();

            $table->date('date');
            $table->time('check_in')->nullable();
            $table->time('check_out')->nullable();

            $table->decimal('working_hours', 8, 2)->default(0);
            $table->integer('late_minutes')->default(0);
            $table->integer('overtime_minutes')->default(0);

            $table->enum('status', ['present', 'absent', 'late', 'leave'])->default('present');

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['employee_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
