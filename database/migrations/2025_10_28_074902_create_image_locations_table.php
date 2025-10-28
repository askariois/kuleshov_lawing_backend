<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('image_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('image_id')->constrained()->cascadeOnDelete();
            $table->string('url');
            $table->timestamps();

            // Уникальный индекс: одно и то же фото не должно быть дважды по одному URL
            $table->unique(['image_id', 'url']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('image_locations');
    }
};
