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

class GenerateImageController extends Controller
{
    public function generate(Request $request, $projectId)
    {
        // Валидация
        $request->validate([
            'image_url' => 'required|url',           // ← теперь URL, а не файл
            'mask_url'  => 'nullable|url',            // ← маска тоже может быть URL
            'prompt'    => 'required|string|max:1000',
            'n'         => 'integer|min:1|max:10',
            'size'      => ['nullable', Rule::in(['256x256', '512x512', '1024x1024'])],
        ]);



        $project = Project::findOrFail($projectId);
        $imageUrl = $request->image_url;  // например: https://client.com/photo.jpg
        try {
            // 1. Скачиваем оригинальное изображение
            $imageData = $this->attachRemoteFile($imageUrl, 'image', 'original.png');

            // Параметры запроса
            $params = [
                'prompt' => 'Изображение в стиле аниме',
                'n' => $request->n ?? 1,
                'size' => $request->size ?? '512x512',
                'user' => 1, // опционально
            ];

            // Запрос к OpenAI
            $response = Http::withoutVerifying() // если SSL проблемы
                ->attach('image', $imageData, 'original.png')
                ->withHeaders([
                    'Authorization' => 'Bearer ' . config('services.openai.key'),
                ])->post('https://api.openai.com/v1/images/edits', $params);

            if ($response->failed()) {
                $error = $response->json('error', ['message' => 'Unknown error']);
                Log::error('OpenAI Edit API Error: ' . json_encode($error));

                return response()->json([
                    'error' => $error['message'] ?? 'API request failed',
                    'type' => $error['type'] ?? 'server_error',
                ], $response->status());
            }

            $openAiData = $response->json();
            $generatedAt = now();
            // Сохранение в БД (для каждого варианта)
            $savedImages = collect($openAiData['data'])->map(function ($item) use ($project, $request, $generatedAt,  $openAiData) {
                // Скачивание файла
                $imageResponse = Http::get($item['url']);
                if ($imageResponse->successful()) {
                    $imageResponse = Http::get($item['url']);

                    if (!$imageResponse->successful()) {
                        return null;
                    }

                    $extension = pathinfo($item['url'], PATHINFO_EXTENSION) ?: 'png';
                    $fileName = 'generated/edit/' . $project->id . '/' . now()->timestamp . '-' . uniqid() . '.' . $extension;
                    $filePath = 'public/' . $fileName;

                    // Создаём папки
                    Storage::disk('local')->makeDirectory(dirname($filePath));
                    Storage::disk('local')->put($filePath, $imageResponse->body());

                    $localUrl = Storage::url($fileName); // → /storage/generated/edit/2/...

                    $dimensions = getimagesize(Storage::disk('local')->path($filePath));
                    $fileSize = Storage::disk('local')->size($filePath);

                    // return GeneratedImage::create([
                    //     'project_id' => $project->id,
                    //     'image_id' => $request->image_id, // опционально
                    //     'url' => $localUrl,
                    //     'openai_url' => $item['url'],
                    //     'prompt' => $request->prompt,
                    //     'model' => 'dall-e-2',
                    //     'size' => $request->size ?? '512x512',
                    //     'n' => $request->n ?? 1,
                    //     'response_data' => $openAiData, // полный ответ
                    //     'width' => null,
                    //     'height' => null,
                    //     'format' => '.png',
                    //     'file_size' => $fileSize,
                    //     'user_id' => 1,
                    //     'status' => 'downloaded',
                    //     'generated_at' => $generatedAt,
                    //     'downloaded_at' => now(),
                    // ]);
                }

                return null;
            })->filter()->values();

            // Успех: возвращаем для фронта (Inertia или JSON)
            return Inertia::render('GeneratedImages/Index', [
                'generatedImages' => $savedImages,
                'project' => $project,
                'success' => 'Изображения успешно отредактированы!',
            ])->toResponse($request)
                ->setStatusCode(201);
        } catch (\Exception $e) {
            Log::error('Image Edit Exception: ' . $e->getMessage());
            return response()->json(['error' => 'Internal server error: ' . $e->getMessage()], 500);
        }
    }


    private function attachRemoteFile($url, $fieldName, $filename = 'image.png')
    {
        // Получаем содержимое по URL
        $imageData = file_get_contents($url);

        if ($imageData === false) {
            throw new \Exception("Не удалось загрузить изображение: $url");
        }

        // Проверяем размер (< 4MB)
        if (strlen($imageData) > 4 * 1024 * 1024) {
            throw new \Exception('Изображение слишком большое (>4MB)');
        }

        // Принудительно делаем PNG (OpenAI требует PNG для edits)
        $image = imagecreatefromstring($imageData);
        if ($image === false) {
            throw new \Exception('Файл не является изображением');
        }

        // Конвертируем в PNG
        ob_start();
        imagepng($image, null, 9);
        $pngData = ob_get_contents();
        ob_end_clean();
        imagedestroy($image);

        // Возвращаем как поток
        return $pngData;
    }

    private function createTransparentMask(\CURLFile $imageFile): \CURLFile
    {
        $tempMask = tempnam(sys_get_temp_dir(), 'mask_') . '.png';

        // Берём размеры оригинала
        $info = getimagesize($imageFile->getFilename());
        $width = $info[0];
        $height = $info[1];

        $img = imagecreatetruecolor($width, $height);
        $transparent = imagecolorallocatealpha($img, 0, 0, 0, 127);
        imagefill($img, 0, 0, $transparent);
        imagesavealpha($img, true);
        imagepng($img, $tempMask);
        imagedestroy($img);

        return new \CURLFile($tempMask, 'image/png', 'mask.png');
    }
}
