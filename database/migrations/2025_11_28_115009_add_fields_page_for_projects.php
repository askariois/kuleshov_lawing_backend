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
        Schema::table('projects', function (Blueprint $table) {
            $table->integer('total_pages')->default(0);
            $table->integer('processed_pages')->default(0);
            $table->enum('scan_status', ['idle', 'pending', 'running', 'completed', 'failed', 'limited'])
                ->default('idle')
                ->after('total_images');
            $table->timestamp('scan_started_at')->nullable()->after('scan_status');
            $table->timestamp('scan_finished_at')->nullable()->after('scan_started_at');
            $table->text('scan_error')->nullable()->after('scan_finished_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('total_pages');
            $table->dropColumn('processed_pages');
            $table->dropColumn('scan_status');
            $table->dropColumn('scan_started_at');
            $table->dropColumn('scan_finished_at');
            $table->dropColumn('scan_error');
        });
    }
};
