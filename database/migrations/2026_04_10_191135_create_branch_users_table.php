<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Move branch assignment from branch_users pivot to users.branch_id, then drop pivot.
     * Foreign key on users.branch_id is added after branches table exists.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'branch_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->unsignedBigInteger('branch_id')->nullable()->index();
            });
        }

        if (Schema::hasTable('branch_users')) {
            $rows = DB::table('branch_users')
                ->whereNull('deleted_at')
                ->orderBy('id')
                ->get();

            foreach ($rows as $row) {
                DB::table('users')
                    ->where('id', $row->user_id)
                    ->whereNull('branch_id')
                    ->update(['branch_id' => $row->branch_id]);
            }

            Schema::dropIfExists('branch_users');
        }

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
        });

        Schema::create('branch_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->boolean('is_default')->default(false);
            $table->unique(['branch_id', 'user_id']);
            $table->softDeletes();
            $table->timestamps();
        });
    }
};
