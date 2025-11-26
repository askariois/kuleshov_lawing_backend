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
        Schema::create('duplicate_sources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('image_duplicates_id')
                ->constrained('image_duplicates')
                ->onDelete('cascade');
            $table->string('domain');
            $table->string('url');
            $table->boolean('is_paid')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('duplicate_sources');
    }
};
