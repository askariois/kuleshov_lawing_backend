<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('generated_images', function (Blueprint $table) {
            $table->id();

            // Связь с проектом
            $table->foreignId('project_id')
                ->constrained('projects')
                ->onDelete('cascade');

            // Если изображение привязано к существующему image (например, для замены)
            $table->foreignId('image_id')
                ->nullable()
                ->constrained('images')
                ->onDelete('set null');

            // Путь к файлу (локальный или S3)
            $table->string('url'); // например: storage/generated/12345.png

            // Оригинальный URL от OpenAI (на случай, если нужно перекачать)
            $table->string('openai_url')->nullable();

            // Промпт, который отправляли
            $table->text('prompt');

            // Модель: dall-e-3, gpt-4o, etc.
            $table->string('model'); // "dall-e-3", "dall-e-2"

            // Размер: 1024x1024, 1792x1024, etc.
            $table->string('size'); // "1024x1024", "1792x1024", "1024x1792"

            // Количество сгенерированных (n)
            $table->unsignedTinyInteger('n')->default(1);

            // Качество (для dall-e-3)
            $table->enum('quality', ['standard', 'hd'])->default('standard')->nullable();

            // Стиль (vivid / natural) — только для dall-e-3
            $table->enum('style', ['vivid', 'natural'])->default('vivid')->nullable();

            // Ответ от OpenAI (полный JSON) — полезно для дебага и пересоздания
            $table->json('response_data')->nullable();

            // Метаданные (ширина, высота, формат, размер файла и т.д.)
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->string('format', 10)->nullable(); // png, jpeg
            $table->unsignedBigInteger('file_size')->nullable(); // в байтах

            // Кто сгенерировал (если есть авторизация)
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->onDelete('set null');

            // Статус: generated, downloaded, error, used и т.д.
            $table->enum('status', ['pending', 'generated', 'downloaded', 'failed', 'used'])
                ->default('pending');

            $table->timestamps(); // created_at, updated_at
            $table->timestamp('generated_at')->nullable(); // когда OpenAI отдал ответ
            $table->timestamp('downloaded_at')->nullable(); // когда файл сохранён локально

            // Индексы для быстрого поиска
            $table->index(['project_id', 'status']);
            $table->index('generated_at');
            $table->index('model');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('generated_images');
    }
};
