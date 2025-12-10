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

            $table->string('ai_name')->nullable();                    // "Мои аватарки", "Аниме-арт"
            $table->text('ai_description')->nullable();               // "Люблю пастельные тона и большие глаза"

            // === Ключевое для Responses API / Assistants API ===
            $table->string('openai_prompt_id')->nullable();        // ID "роли" (инструкций) – создаётся один раз
            $table->string('openai_conversation_id')->nullable();  // ID чата (память) – один на весь проект

            // === Опционально, но очень полезно ===
            $table->string('preferred_style')->default('90s-anime'); // или 'modern-anime', 'ghibli' и т.д.
            $table->string('preferred_size')->default('1024x1536');  // 1024x1024 | 1024x1536 | 1792x1024
            $table->string('preferred_quality')->default('high');    // low | medium | high (для gpt-image-1)
            $table->integer('generated_count')->default(0);         // сколько уже сгенерировано
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('ai_name');
            $table->dropColumn('ai_description');
            $table->dropColumn('openai_prompt_id');
            $table->dropColumn('openai_conversation_id');
            $table->dropColumn('preferred_style');
            $table->dropColumn('preferred_size');
            $table->dropColumn('preferred_quality');
            $table->dropColumn('generated_count');
        });
    }
};
