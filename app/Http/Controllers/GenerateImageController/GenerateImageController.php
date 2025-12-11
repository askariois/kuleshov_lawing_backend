<?php

namespace App\Http\Controllers\GenerateImageController;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateAiImageJob;
use App\Models\Image;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;


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
        $image_url = $request->image_url;
        $mask_url = $request->mask_url;
        $prompt = $request->prompt;
        $size = $request->size;
        Image::where('id',  $image_id)->update(['status_generate' => 'pending']);

        try {
            GenerateAiImageJob::dispatch($projectId, $image_id,  $image_url, $mask_url,  $prompt,  $size);
            return Inertia::location("/single/$image_id");
        } catch (\Exception $e) {
            Log::error('GPT-Image-1 Generation Error: ' . $e->getMessage(), [
                'project_id' => $projectId,
                'trace'      => $e->getTraceAsString()
            ]);

            return response()->json(['error' => 'Ошибка генерации: ' . $e->getMessage()], 500);
        }
    }
}
