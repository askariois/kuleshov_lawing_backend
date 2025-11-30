<?php

namespace App\Jobs;

use App\Models\Image;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class ProcessImageSitemapChunkJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [10, 30, 60];

    protected array $imageUrls;
    protected string $foundOnPage;
    protected int $projectId;

    public function __construct(array $imageUrls, string $foundOnPage, int $projectId)
    {
        $this->imageUrls = $imageUrls;
        $this->foundOnPage = $foundOnPage;
        $this->projectId = $projectId;
    }

    public function handle()
    {
        $client = new Client(['timeout' => 40, 'connect_timeout' => 15]);

        foreach ($this->imageUrls as $url) {
            try {
                $response = $client->get($url);
                $filename = basename(parse_url($url, PHP_URL_PATH)) ?: md5($url) . '.jpg';
                $path = "images/{$this->projectId}/{$filename}";

                Storage::disk('public')->put($path, $response->getBody());

                Image::create([
                    'project_id' => $this->projectId,
                    'url' => $url,
                    'path' => $path,
                    'filename' => $filename,
                    'found_on' => $this->foundOnPage,
                ]);
            } catch (RequestException $e) {
                // Логируем, но не падаем
            }
        }
    }
}
