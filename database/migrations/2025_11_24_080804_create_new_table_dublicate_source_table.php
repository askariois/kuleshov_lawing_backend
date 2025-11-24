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
            $table->foreignId('dublicate_id')->constrained()->cascadeOnDelete();
            $table->string('domain');           // например: shutterstock.com
            $table->string('name');             // Shutterstock
            $table->boolean('is_paid')->nullable();  // платный или бесплатный
            $table->timestamps();
            $table->unique('domain');
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
