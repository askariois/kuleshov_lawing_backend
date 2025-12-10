<?php

namespace App\Http\Controllers\GenerateImageController;

use App\Http\Controllers\Controller;
use App\Models\GeneratedImage;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use OpenAI;

class GenerateImageController extends Controller
{



    public function generate(Request $request, $projectId)
    {
        $request->validate([
            'image_url' => 'required|url',           // Исходное изображение
            'mask_url'  => 'nullable|url',           // Маска для inpainting (опционально)
            'n'         => 'integer|min:1|max:10',   // Количество изображений (поддерживается!)
            'size'      => ['nullable', Rule::in(['1024x1024', '1024x1536', '1536x1024', 'auto'])], // Для gpt-image-1
        ]);
        $image_id = $request->image_id;
        $project = Project::findOrFail($projectId);
        $client = OpenAI::client(config('services.openai.key'));

        try {
            // === 1. Скачиваем изображение/маску (API требует multipart/form-data с файлами) ===
            $imageData = $this->downloadRemoteFile($request->image_url, 'original.png');
            $maskData = $request->mask_url ? $this->downloadRemoteFile($request->mask_url, 'mask.png') : null;

            // === 2. Строим промпт с памятью проекта ===
            // $fullPrompt = "Проанализируй изображение по ссылке $request->image_url и создай на его основе новое изображение";
            $fullPrompt = "Проанализируй изображение по ссылке $request->image_url и создай на его основе новое изображение, с учётом следующих параметров:"  . ' ' . ($project->ai_description) .  ' ' . $request->prompt;

            // === 3. Вызов Images API (endpoint /v1/images/edits для image-to-image) ===
            $response = $client->images()->create([
                'model'         => 'gpt-image-1',
                'prompt'        => $fullPrompt,          // Промпт (max 32k символов)
                'n'             => 1,     // ← Теперь работает!
                'size'          => $request->size ?? '1024x1024',
                // 'quality'       => 'standard',               // high/medium/low (для gpt-image-1)
            ], [
                'image' => $imageData,                   // Обязательно для edits
                ...($maskData ? ['mask' => $maskData] : []), // Опционально для inpainting
            ]);



            // === 4. Сохраняем результаты ===
            $generatedAt = now();
            $savedImages = collect($response->data ?? [])->map(function ($item) use ($project, $request, $generatedAt, $image_id, $fullPrompt) {
                $imageUrl = $item->url ?? null;
                if (!$imageUrl) return null;

                // Скачиваем (один раз, без дубликата!)
                $imageResponse = Http::get($imageUrl);
                if (!$imageResponse->successful()) return null;

                $extension = pathinfo($imageUrl, PATHINFO_EXTENSION) ?: 'png';


                $dateFolder = now()->format('Y-m-d');
                $fileName = 'anime_' . uniqid() . '.' . $extension;

                $path = "generated/anime/{$project->id}/{$image_id}/{$dateFolder}/{$fileName}";

                // Сохраняем файл
                Storage::disk('public')->makeDirectory(dirname($path));
                Storage::disk('public')->put($path, $imageResponse->body());

                // Публичный URL
                $publicUrl = Storage::url($path);

                // Получаем размеры
                $fullPath = Storage::disk('public')->path($path);
                $info = getimagesize($fullPath);
                $width = $info[0] ?? null;
                $height = $info[1] ?? null;
                $fileSize = Storage::disk('public')->size($path);

                return GeneratedImage::create([
                    'project_id'    => $project->id,
                    'url'           => $publicUrl,
                    'openai_url'    => $imageUrl,
                    'prompt'        => $fullPrompt,
                    'image_id' => $image_id,
                    'model'         => 'dall-e-3',
                    'size'          => $request->size ?? '1024x1024',
                    'n'             => $request->n ?? 1,
                    // 'response_data' => $response->toArray(),
                    'width'         => $width,
                    'height'        => $height,
                    'format'        => '.' . $extension,
                    'file_size'     => $fileSize,
                    'user_id'       => auth()->id(),
                    'status'        => 'downloaded',
                    'generated_at'  => $generatedAt,
                    'downloaded_at' => now(),
                ]);
            })->filter()->values();

            // === 5. Возвращаем успех ===
            return Inertia::location("/single/$image_id");
        } catch (\Exception $e) {
            Log::error('GPT-Image-1 Generation Error: ' . $e->getMessage(), [
                'project_id' => $projectId,
                'trace'      => $e->getTraceAsString()
            ]);

            return response()->json(['error' => 'Ошибка генерации: ' . $e->getMessage()], 500);
        }
    }

    // Вспомогательный метод для скачивания (замени на твой attachRemoteFile)
    private function downloadRemoteFile($url, $filename)
    {
        $response = Http::get($url);
        if (!$response->successful()) {
            throw new \Exception("Не удалось скачать файл: {$url}");
        }
        return $response->body(); // Возвращаем сырые данные для attach
    }
}
