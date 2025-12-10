<?php

namespace App\Jobs;

use App\Models\Image;
use App\Models\ImageDuplicate;
use App\Models\DuplicateSource;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CheckImageDuplicates implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $image;

    public function __construct(Image $image)
    {
        $this->image = $image;
    }

    public function handle(): void
    {

        $key = app()->environment('local', 'testing')
            ? "6mm60lsCNIBqFwOWjJqA80QZHh9BMwc-ber4u=t^"
            : config('services.tineye.api_key');

        $imageUrl = app()->environment('local', 'testing')
            ? 'https://api.tineye.com/rest/docs/img/meloncat.jpg'
            : $this->image->path;

        try {
            $response = Http::withHeaders([
                'x-api-key' => $key,
            ])->timeout(60)->get('https://api.tineye.com/rest/search/', [
                'image_url' => $imageUrl,
                'tags' => 'stock'
            ]);

            if (!$response->successful()) {
                Log::warning('TinEye API не вернул 200', [
                    'image_id' => $this->image->id,
                    'status' => $response->status(),
                ]);
                return;
            }

            $data = $response->json();
            $matches = $data['results']['matches'] ?? [];
            $images_count = $data['stats']['total_results'] ?? 0;
            $stock_images_count = $data['stats']['total_stock'] ?? 0;

            // 1. Создаём или обновляем запись дубликатов
            $imageDuplicate = ImageDuplicate::updateOrCreate(
                ['image_id' => $this->image->id],
                [
                    'images_count'       => $images_count,
                    'stock_images_count' => $stock_images_count,
                    'checked_at'         => now(),
                ]
            );

            $imageDuplicate->sources()->delete();

            // 3. Проходим по всем найденным матчам
            foreach ($matches as $match) {
                $domain = $match['domain'] ?? null;
                $backlink = $match['backlinks'][0]['url'] ?? null; // первый URL
                $isPaid = $match['tags'][0] == "stock";

                if (!$domain || !$backlink) {
                    continue;
                }

                // Приводим к чистому домену (shutterstock.com, не www.shutterstock.com)
                $cleanDomain = strtolower(preg_replace('/^www\./', '', parse_url($domain, PHP_URL_HOST) ?: $domain));

                // 4. Находим или создаём источник
                DuplicateSource::create([
                    'image_duplicates_id' => $imageDuplicate->id,
                    'domain'              => $cleanDomain,
                    'url'                 => $backlink,
                    'is_paid'             => $isPaid,
                ]);
            }
            ImageDuplicate::updateOrCreate(
                ['image_id' => $this->image->id],
                [
                    'status'  => "complated",
                ]
            );
            Log::info("Дубликаты обработаны для изображения {$this->image->id}", [
                'found' => count($matches),
                'sources_attached' => $imageDuplicate->sources()->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('TinEye API error', [
                'image_id' => $this->image->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
