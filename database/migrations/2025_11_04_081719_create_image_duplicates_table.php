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
        // database/migrations/xxxx_create_image_duplicates_table.php
        Schema::create('image_duplicates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('image_id')->constrained()->cascadeOnDelete();
            $table->json('site_name')->nullable();
            $table->integer('images_count')->nullable();
            $table->integer('stock_images_count')->nullable();
            $table->timestamp('checked_at');
            $table->timestamps();

            $table->unique(['image_id']); // один и тот же URL не дублируем
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('image_duplicates');
    }
};
