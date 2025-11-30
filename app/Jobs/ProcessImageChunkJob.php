<?php

namespace App\Jobs;

use App\Models\Image;
use App\Models\ImageLocation;
use App\Models\Project;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Exception\TransferException; // добавь этот use

class ProcessImageChunkJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 300;
    public $backoff = [10, 30, 60];

    protected $imageUrls;
    protected $pageUrl;
    protected $projectId;

    public function __construct(array $imageUrls, string $pageUrl, int $projectId)
    {
        $this->imageUrls = $imageUrls;
        $this->pageUrl = $pageUrl;
        $this->projectId = $projectId;
    }

    public function handle()
    {

        $client = new Client([
            'timeout'          => 30,
            'connect_timeout'  => 15,
            'verify'           => false,
            'http_errors'      => false,
            'headers'          => [
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept-Language' => 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            ],
        ]);

        foreach ($this->imageUrls as $imageUrl) {

            // ────────────────── ЗАЩИТА ОТ МУСОРА (исправленная!) ──────────────────
            if (empty($imageUrl)) {
                continue;
            }

            // Пропускаем data:, blob:, javascript:, mailto:, якоря # и ftp:
            if (preg_match('#^ (data|blob|javascript|mailto|ftp): #ix', $imageUrl)) {
                continue;
            }




            // Если ссылка начинается с //example.com — делаем https:
            if (str_starts_with($imageUrl, '//')) {
                $imageUrl = 'https:' . $imageUrl;
            }

            // Если после всех правок нет схемы http/https — пропускаем
            if (!preg_match('#^https?://#i', $imageUrl)) {
                continue;
            }
            // ─────────────────────────────────────────────────────────────────────

            // 1. Уже есть в базе?
            $parentId = Project::where('id', $this->projectId)->value('parent_id');

            if ($parentId) {
                $parsed = parse_url($imageUrl);

                // Берём путь + query (если есть)
                $pathToMatch = $parsed['path'] ?? '';
                if (!empty($parsed['query'])) {
                    $pathToMatch .= '?' . $parsed['query'];
                }

                if ($pathToMatch && $pathToMatch !== '/') {
                    $image = Image::where('project_id', $parentId)
                        ->where(function ($query) use ($pathToMatch) {
                            $query->where('path', 'LIKE', '%' . $pathToMatch)
                                ->orWhere('path', 'LIKE', '%' . $pathToMatch . '%');
                        })
                        ->first();

                    if ($image && $image->size !== null) {
                        ImageLocation::firstOrCreate([
                            'image_id' => $image->id,
                            'url'      => $this->pageUrl,
                        ]);
                        continue; // ← пропускаем скачивание
                    }
                }
            }

            $image = Image::where('path', $imageUrl)
                ->where('project_id', $this->projectId)
                ->first();

            if ($image && $image->size !== null) {
                ImageLocation::firstOrCreate([
                    'image_id' => $image->id,
                    'url'      => $this->pageUrl,
                ]);
                continue;
            }

            try {
                $response = $client->get($imageUrl, ['timeout' => 60]);
                $statusCode = $response->getStatusCode();

                if ($statusCode >= 400) {
                    Log::info('Image HTTP error – skip', [
                        'url'        => $imageUrl,
                        'status'     => $statusCode,
                        'project_id' => $this->projectId
                    ]);
                    continue;
                }

                $mime = $response->getHeaderLine('Content-Type') ?? '';
                if (!str_starts_with($mime, 'image/')) {
                    Log::info('Not an image mime', ['url' => $imageUrl, 'mime' => $mime]);
                    continue;
                }

                $body = $response->getBody()->getContents();
                $sizeInfo = @getimagesizefromstring($body);

                $width  = $sizeInfo[0] ?? null;
                $height = $sizeInfo[1] ?? null;
                $size   = strlen($body);

                $path = $imageUrl;
                $ext  = pathinfo(parse_url($imageUrl, PHP_URL_PATH), PATHINFO_EXTENSION) ?: 'jpg';
                $name = Str::slug(pathinfo($imageUrl, PATHINFO_FILENAME)) . '.' . $ext;

                $image = Image::updateOrCreate(
                    ['path' => $path, 'project_id' => $this->projectId],
                    [
                        'name'      => $name,
                        'mime_type' => $mime,
                        'size'      => $size,
                        'width'     => $width,
                        'height'    => $height,
                        'status'    => 'raw',
                    ]
                );

                ImageLocation::firstOrCreate([
                    'image_id' => $image->id,
                    'url'      => $this->pageUrl,
                ]);
            } catch (ConnectException | TransferException $e) {
                Log::info('Image download timeout/connection failed – will retry on next chunk', [
                    'url'        => $imageUrl,
                    'page'       => $this->pageUrl,
                    'error'      => $e->getMessage(),
                    'project_id' => $this->projectId
                ]);
                continue;
            } catch (RequestException $e) {
                Log::info('Image download failed (HTTP/client error)', [
                    'url'        => $imageUrl,
                    'error'      => $e->getMessage(),
                    'project_id' => $this->projectId
                ]);
                continue;
            } catch (\Exception $e) {
                Log::warning('Unexpected image processing error', [
                    'url'        => $imageUrl,
                    'error'      => $e->getMessage(),
                    'project_id' => $this->projectId
                ]);
                continue;
            }
        }
    }
}
