<?php

namespace App\Jobs;

use App\Models\Image;
use App\Models\ImageDuplicate;
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

    public  $image;

    public function __construct($image)
    {
        $this->image = $image;
    }

    public function handle(): void
    {

        try {
            // $response = Http::withHeaders([
            //     'x-api-key' => config('services.tineye.api_key'),
            // ])->timeout(60)->get('https://api.tineye.com/rest/search/', [
            //     'image_url' =>  $this->image->path,
            // ]);

            $response = Http::withHeaders([
                'x-api-key' => "6mm60lsCNIBqFwOWjJqA80QZHh9BMwc-ber4u=t^",
            ])->timeout(60)->get('https://api.tineye.com/rest/search/', [
                'image_url' => "https://api.tineye.com/rest/docs/img/meloncat.jpg",
            ]);
            Log::info("Дубликат {$response->successful()}");
            if ($response->successful()) {
                $data = $response->json();
                $matches = $data['results']['matches'] ?? [];
                $images_count = $data['stats']['total_results'] ?? 0;
                $stock_images_count = $data['stats']['total_stock'] ?? 0;

                $domains = collect($matches)
                    ->pluck('domain')
                    ->filter()
                    ->unique()
                    ->take(10)
                    ->implode(', ');

                ImageDuplicate::updateOrCreate(
                    ['image_id' => $this->image->id], // уникально по image_id
                    [
                        'site_name'           => $domains ?: 'Нет дублей',
                        'images_count'        =>  $images_count,
                        'stock_images_count'  =>  $stock_images_count, // если нужно — посчитай отдельно
                        'checked_at'          => now(),
                    ]
                );
            } else {
                Log::warning('TinEye API не вернул 200', [
                    'image_id' =>  $this->image->id,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('TinEye API error', [
                'image_id' =>  $this->image->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
