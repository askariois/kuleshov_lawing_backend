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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('url')->nullable();

            $table->dateTime('last_scan')->nullable();

            $table->unsignedInteger('images_count')->default(0);
            $table->unsignedInteger('processed_images')->default(0);
            $table->unsignedInteger('not_processed_images')->default(0);

            $table->string('notification')->nullable();

            $table->string('format_images')->default('webp');

            $table->boolean('autoscan')->default(false);

            $table->string('time_autoscan')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
