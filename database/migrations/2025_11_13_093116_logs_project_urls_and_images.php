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
        Schema::create('crawled_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('url')->index();
            $table->unsignedInteger('images_count')->default(0);
            $table->enum('status', ['success', 'failed', 'timeout', 'blocked'])->default('success');
            $table->text('error')->nullable();
            $table->timestamp('crawled_at')->useCurrent();
            $table->unique(['project_id', 'url']); // одна страница — одна запись
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crawled_logs');
    }
};
