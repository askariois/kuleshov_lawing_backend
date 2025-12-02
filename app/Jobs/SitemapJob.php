<?php

namespace App\Jobs;

use App\Models\CrawledLogs;
use App\Models\Image;
use App\Models\ImageLocation;
use App\Models\Project;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Client;
use GuzzleHttp\Promise\Utils;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;
use Symfony\Component\DomCrawler\Crawler;

class SitemapJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 7200;                                 // 2 часа на большие сайты
    public $tries   = 5;
    public $backoff = [30, 60, 120, 300, 600];

    protected string $startUrl;
    protected int    $projectId;
    protected string $cacheKey;

    public function __construct(string $startUrl, int $projectId)
    {
        $this->startUrl  = rtrim($startUrl, '/');
        $this->projectId = $projectId;
        $this->cacheKey  = 'sitemap_progress_' . $projectId;

        Log::info('[SitemapJob] Job создан', [
            'project_id' => $projectId,
            'site'       => $this->startUrl,
        ]);
    }

    public function handle(): void
    {
        Log::info('[SitemapJob] START', ['project_id' => $this->projectId]);

        try {

            // ВАЖНО: Сразу ставим статус running в БД
            Project::where('id', $this->projectId)->update([
                'scan_status'      => 'running',
                'scan_started_at'  => now(),
                'scan_finished_at' => null,
                'scan_error'       => null,
            ]);


            Cache::put($this->cacheKey, [
                'progress'        => 0,
                'processed_pages' => 0,
                'total_pages'     => 0,
                'total_images'    => 0,
                'status'          => 'raw',
                'started_at'      => now()->toDateTimeString(),
            ], now()->addHours(12));

            // ───── Динамический вежливый User-Agent ─────
            $yourDomain     = parse_url(config('app.url'), PHP_URL_HOST) ?? 'scanner.local';
            $scannedDomain  = parse_url($this->startUrl, PHP_URL_HOST) ?? 'unknown';
            $userAgent      = "SiteScannerBot/1.0 (+{$yourDomain}) – scanning {$scannedDomain}";

            Log::info('[SitemapJob] User-Agent', ['ua' => $userAgent]);

            $client = new Client([
                'timeout'         => 30,
                'connect_timeout' => 15,
                'headers'         => [
                    'User-Agent'      => $userAgent,
                    'Accept'          => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language' => 'ru-RU,ru;q=0.9,en;q=0.8',
                    'Accept-Encoding' => 'gzip, deflate',
                    'Referer'         => $this->startUrl . '/',
                ],
                'verify'          => false,
                'http_errors'     => false,
                'allow_redirects' => true,
                'cookies'         => true,
            ]);

            // ───── Получаем все страницы из sitemap ─────
            $pageUrls = $this->getUrlsFromSitemap($client);

            if (empty($pageUrls)) {
                Log::warning('[SitemapJob] Sitemap пустой', ['project_id' => $this->projectId]);
                Project::where('id', $this->projectId)->update([
                    'scan_status'     => 'failed',
                    'scan_finished_at' => now(),
                    'scan_error'      => 'Sitemap не найден или пустой',
                ]);
                $this->markAsFailed('Sitemap не найден или пустой');
                return;
            }

            Log::info('[SitemapJob] Найдено страниц', ['count' => count($pageUrls)]);

            $totalPages = count($pageUrls);
            $processed  = 0;

            foreach ($pageUrls as $pageUrl) {
                $processed++;
                $this->updateProgress($processed, $totalPages);

                // ПРОВЕРЯЕМ: уже сканировали эту страницу?
                $existingLog = CrawledLogs::where('project_id', $this->projectId)
                    ->where('url', $pageUrl)
                    ->first();

                if ($existingLog && in_array($existingLog->status, ['success', 'skipped'])) {
                    Log::info("[SitemapJob] Страница уже обработана — пропускаем", ['url' => $pageUrl]);
                    continue; // полностью пропускаем — не тратим запросы
                }



                // ПРОВЕРЯЕМ: уже сканировали эту страницу?
                $existingImage = Image::where('project_id', $this->projectId)
                    ->where('path', $pageUrl)
                    ->first();

                if ($existingImage) {
                    Log::info("[SitemapJob] Страница уже обработана — пропускаем", ['url' => $pageUrl]);
                    continue;
                }

                Log::info("[SitemapJob] Страница {$processed}/{$totalPages}", ['url' => $pageUrl]);

                try {
                    $response    = $client->get($pageUrl);
                    $statusCode  = $response->getStatusCode();
                    $contentType = $response->getHeaderLine('Content-Type');

                    if ($statusCode !== 200 || !str_contains($contentType, 'text/html')) {
                        CrawledLogs::updateOrCreate(
                            ['project_id' => $this->projectId, 'url' => $pageUrl],
                            ['images_count' => 0, 'status' => 'skipped', 'crawled_at' => now()]
                        );
                        usleep(rand(1800000, 2800000));
                        continue;
                    }

                    $html       = $response->getBody()->getContents();
                    $crawler    = new Crawler($html, $pageUrl);
                    $imageUrls  = $this->extractImageUrls($crawler, $pageUrl);

                    CrawledLogs::updateOrCreate(
                        ['project_id' => $this->projectId, 'url' => $pageUrl],
                        ['images_count' => count($imageUrls), 'status' => 'success', 'crawled_at' => now()]
                    );

                    // ───── Асинхронно собираем метаданные изображений ─────
                    $promises = [];

                    foreach ($imageUrls as $imgUrl) {
                        $cleanUrl = strtok($imgUrl, '?');                       // убираем query-параметры
                        $path     = parse_url($cleanUrl, PHP_URL_PATH) ?: '/unknown.jpg';
                        $name     = basename($path) ?: 'unknown.jpg';

                        // Уникальность по path + project_id (именно так у тебя в БД)
                        // КЛЮЧЕВАЯ ЛОГИКА: Ищем изображение сначала у родителя, потом у себя
                        $image = $this->findOrCreateSharedImage(
                            fullUrl: $imgUrl,
                            name: $name,
                            projectId: $this->projectId
                        );

                        ImageLocation::firstOrCreate([
                            'image_id' => $image->id,
                            'url'      => $pageUrl,
                        ]);

                        // Асинхронный HEAD → потом GET если нужно
                        $promises[$image->id] = $client->headAsync($cleanUrl, ['timeout' => 12])
                            ->then(function ($resp) use ($image) {
                                $this->applyHeadMetadata($image, $resp);
                            })
                            ->otherwise(function ($reason) use ($client, $image, $cleanUrl) {
                                $this->fallbackToGetMetadata($client, $image, $cleanUrl);
                            });
                    }

                    // Ждём все промисы (очень быстро)
                    if ($promises) {
                        Utils::settle($promises)->wait();
                    }
                } catch (ConnectException $e) {
                    CrawledLogs::updateOrCreate(
                        ['project_id' => $this->projectId, 'url' => $pageUrl],
                        ['images_count' => 0, 'status' => 'timeout', 'crawled_at' => now()]
                    );
                } catch (RequestException $e) {
                    $code = $e->getResponse()?->getStatusCode() ?? 0;
                    if (in_array($code, [429, 403, 503])) {
                        Log::warning("[SitemapJob] Блокировка {$code}", ['url' => $pageUrl]);
                        sleep(45);
                    }
                    CrawledLogs::updateOrCreate(
                        ['project_id' => $this->projectId, 'url' => $pageUrl],
                        ['images_count' => 0, 'status' => 'blocked', 'crawled_at' => now()]
                    );
                } catch (\Throwable $e) {
                    Log::error('[SitemapJob] Ошибка страницы', ['url' => $pageUrl, 'error' => $e->getMessage()]);
                    CrawledLogs::updateOrCreate(
                        ['project_id' => $this->projectId, 'url' => $pageUrl],
                        ['images_count' => 0, 'status' => 'failed', 'error' => $e->getMessage(), 'crawled_at' => now()]
                    );
                }

                usleep(rand(1800000, 2800000)); // 1.8–2.8 сек — вежливо
            }

            // ───── Финализация ─────
            $totalImages = Image::where('project_id', $this->projectId)->count();

            Project::where('id', $this->projectId)->update([
                'last_scan'    => now(),
                'images_count'    => $totalImages,
                'scan_status'     => 'completed',
                'scan_finished_at' => now(),
            ]);

            Cache::put($this->cacheKey, [
                'progress'        => 100,
                'processed_pages' => $processed,
                'total_pages'     => $totalPages,
                'total_images'    => $totalImages,
                'status'          => 'completed',
                'finished_at'     => now()->toDateTimeString(),
            ], now()->addHours(12));

            Log::info('[SitemapJob] УСПЕШНО ЗАВЕРШЁН', [
                'project_id' => $this->projectId,
                'pages'      => $processed,
                'images'     => $totalImages,
            ]);
        } catch (\Throwable $e) {
            Log::critical('[SitemapJob] КРИТИЧЕСКАЯ ОШИБКА', [
                'project_id' => $this->projectId,
                'error'      => $e->getMessage(),
                'trace'      => $e->getTraceAsString(),
            ]);

            $this->markAsFailed('Критическая ошибка: ' . $e->getMessage());
        }
    }

    private function applyHeadMetadata(Image $image, $response): void
    {
        $mime = $response->getHeaderLine('Content-Type');
        $size = (int) $response->getHeaderLine('Content-Length') ?: null;

        $image->update([
            'mime_type' => $mime ?: null,
            'size'      => $size,
            'status'    => 'raw',
        ]);
    }

    private function fallbackToGetMetadata(Client $client, Image $image, string $url): void
    {
        try {
            $resp = $client->get($url, ['timeout' => 20, 'stream' => true]);
            $size = (int) $resp->getHeaderLine('Content-Length');
            $mime = $resp->getHeaderLine('Content-Type');

            if ($size && $size > 12 * 1024 * 1024) { // >12 МБ — не парсим
                $image->update(['mime_type' => $mime, 'size' => $size, 'status' => 'too_large']);
                return;
            }

            $stream = $resp->getBody();
            $stream->seek(0);
            $chunk = $stream->read(2 * 1024 * 1024); // 2 МБ достаточно

            if ($info = @getimagesizefromstring($chunk)) {
                $image->update([
                    'mime_type' => $mime ?? $info['mime'],
                    'size'      => $size,
                    'width'     => $info[0] ?? null,
                    'height'    => $info[1] ?? null,
                    'status'    => 'processed',
                ]);
            } else {
                $image->update(['mime_type' => $mime, 'size' => $size, 'status' => 'raw']);
            }
        } catch (\Throwable $e) {
            Log::warning('[SitemapJob] Метаданные не получены', ['url' => $url]);
            $image->update(['status' => 'error']);
        }
    }

    private function getUrlsFromSitemap(Client $client): array
    {
        $urls = [];

        Log::info('[SitemapJob] Пытаемся загрузить sitemap_index.xml');

        // 1. Сначала пробуем sitemap_index.xml (если есть)
        try {
            $response = $client->get($this->startUrl . '/sitemap_index.xml');
            $xml = simplexml_load_string($response->getBody()->getContents());

            if ($xml === false) {
                throw new \Exception('Invalid XML');
            }

            foreach ($xml->sitemap as $sitemap) {
                $loc = (string)$sitemap->loc;
                Log::info('[SitemapJob] Загружаем под-sitemap', ['loc' => $loc]);
                try {
                    $sub = $client->get($loc);
                    $subXml = simplexml_load_string($sub->getBody()->getContents());
                    if ($subXml !== false) {
                        foreach ($subXml->url as $url) {
                            $locUrl = (string)$url->loc;
                            if ($locUrl) {
                                $urls[] = $locUrl;
                            }
                        }
                    }
                } catch (\Throwable $e) {
                    Log::warning('[SitemapJob] Не удалось загрузить под-sitemap', ['loc' => $loc, 'error' => $e->getMessage()]);
                }
                sleep(1);
            }
        } catch (\Throwable $e) {
            Log::info('[SitemapJob] sitemap_index.xml не найден или ошибка, пробуем sitemap.xml', ['error' => $e->getMessage()]);

            // 2. Пробуем обычный sitemap.xml
            try {
                $response = $client->get($this->startUrl . '/sitemap.xml');
                $xml = simplexml_load_string($response->getBody()->getContents());

                if ($xml === false) {
                    throw new \Exception('Invalid XML in sitemap.xml');
                }

                // Поддержка как <urlset> так и <url> напрямую
                foreach ($xml->url as $url) {
                    $locUrl = (string)$url->loc;
                    if ($locUrl) {
                        $urls[] = $locUrl;
                    }
                }

                Log::info('[SitemapJob] sitemap.xml успешно загружен', ['urls_count' => count($urls)]);
            } catch (\Throwable $e2) {
                Log::error('[SitemapJob] Оба sitemap не найдены', [
                    'error_index' => $e->getMessage(),
                    'error_xml'   => $e2->getMessage(),
                ]);
            }
        }

        $urls = array_unique(array_filter($urls));

        Log::info('[SitemapJob] Итого уникальных URL из sitemap', ['count' => count($urls)]);

        return $urls;
    }


    private function extractImageUrls(Crawler $crawler, string $baseUrl): array
    {
        $list = [];

        foreach ($crawler->filter('img') as $node) {
            /** @var \DOMElement $node */
            $src = $node->getAttribute('src')
                ?: $node->getAttribute('data-src')
                ?: $node->getAttribute('data-lazy-src')
                ?: $node->getAttribute('data-original')
                ?: $node->getAttribute('srcset');

            if (!$src || trim($src) === '') {
                continue;
            }

            $src = trim($src);

            // Исключаем data-uri (base64, svg+xml и т.п.)
            if (str_starts_with($src, 'data:')) {
                continue;
            }

            // Исключаем blob: (часто в React-приложениях)
            if (str_starts_with($src, 'blob:')) {
                continue;
            }

            // Исключаем javascript:
            if (str_starts_with(strtolower($src), 'javascript:')) {
                continue;
            }

            // Если в srcset — берём первый URL
            if (str_contains($src, ',')) {
                $parts = preg_split('/\s+/', trim($src));
                $src = $parts[0] ?? '';
            }

            // Убираем якорь (#lazyload и т.п.)
            $src = strtok($src, '#');

            $fullUrl = $this->makeAbsoluteUrl($src, $baseUrl);

            // Только изображения с нашего домена и с нормальным расширением
            if (
                $this->isImageAllowedFromDomain($fullUrl) &&
                $this->hasImageExtension($fullUrl)
            ) {
                $list[] = $fullUrl;
            }
        }

        return array_unique($list);
    }

    // Вспомогательный метод — проверяет, что URL выглядит как изображение
    private function hasImageExtension(string $url): bool
    {
        $ext = strtolower(pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION));

        return in_array($ext, [
            'jpg',
            'jpeg',
            'png',
            'gif',
            'webp',
            'avif',
            'svg',
            'bmp',
            'ico',
            'tiff',
            'tif'
        ], true);
    }

    private function makeAbsoluteUrl(string $url, string $base): string
    {
        if (str_starts_with($url, 'http')) return $url;
        if (str_starts_with($url, '//')) return 'https:' . $url;
        if (str_starts_with($url, '/')) return rtrim($this->startUrl, '/') . $url;
        return rtrim($base, '/') . '/' . $url;
    }

    /**
     * Разрешает ли проект сохранять изображения с этого домена
     */
    private function isImageAllowedFromDomain(string $imageUrl): bool
    {
        $imageHost = parse_url($imageUrl, PHP_URL_HOST);
        if (!$imageHost) {
            return true; // относительный путь — всегда разрешён
        }

        $projectHost = parse_url($this->startUrl, PHP_URL_HOST);

        // 1. Основной домен — только свои изображения
        $project = Project::select('parent_id', 'url')->find($this->projectId);

        if (!$project->parent_id) {
            // Это основной домен — разрешаем только свой хост
            return strtolower($imageHost) === strtolower($projectHost);
        }

        // 2. Это поддомен — разрешаем:
        //    - свой домен
        //    - основной домен (parent)
        $mainDomainProject = Project::select('url')
            ->where('id', $project->parent_id)
            ->first();

        if (!$mainDomainProject) {
            return strtolower($imageHost) === strtolower($projectHost); // fallback
        }

        $mainDomainHost = parse_url($mainDomainProject->domain, PHP_URL_HOST)
            ?? $mainDomainProject->domain;

        $allowedHosts = [
            strtolower($projectHost),
            strtolower($mainDomainHost),
        ];

        return in_array(strtolower($imageHost), $allowedHosts, true);
    }


    private function findOrCreateSharedImage(string $fullUrl, string $name, int $projectId): Image
    {
        // КЛЮЧЕВАЯ ФИШКА: Приводим любой URL к единому "нормализованному пути"
        $normalizedPath = $this->normalizePath($fullUrl);

        $project = Project::select('id', 'parent_id')->find($projectId);

        // 1. Если это поддомен — ищем у родителя по нормализованному пути
        if ($project->parent_id) {
            $parentImage = Image::where('project_id', $project->parent_id)
                ->whereRaw('LOWER(SUBSTRING_INDEX(path, "/", -1)) = LOWER(?)', [$normalizedPath])
                ->orWhere('path', 'LIKE', "%{$normalizedPath}")
                ->first();

            if ($parentImage) {
                // Log::info('[SitemapJob] Найдено у родителя по нормализованному пути', [
                //     'normalized' => $normalizedPath,
                //     'parent_image_id' => $parentImage->id,
                // ]);
                return $parentImage;
            }
        }

        // 2. Если не нашли — создаём у текущего проекта (с полным URL)
        return Image::updateOrCreate(
            [
                'project_id' => $projectId,
                'path'       => $fullUrl, // оставляем как есть — для скачивания
            ],
            [
                'name'       => $name,
                'mime_type'  => null,
                'size'       => null,
                'width'      => null,
                'height'     => null,
                'status'     => 'raw',
            ]
        );
    }


    private function normalizePath(string $url): string
    {
        $parsed = parse_url($url);
        if (!$parsed) return $url;

        $path = $parsed['path'] ?? '/';

        // Убираем query и fragment
        $path = strtok($path, '?');
        $path = strtok($path, '#');

        // Приводим к нижнему регистру (на всякий случай)
        return strtolower($path);
    }

    private function updateProgress(int $processed, int $total): void
    {
        $progress = $total > 0 ? min(99, (int)round(($processed / $total) * 100)) : 0;

        Cache::put($this->cacheKey, [
            'progress'        => $progress,
            'processed_pages' => $processed,
            'total_pages'     => $total,
            'total_images'    => Image::where('project_id', $this->projectId)->count(),
            'status'          => 'raw',
        ], now()->addHours(12));
    }

    private function markAsFailed(string $message): void
    {
        Project::where('id', $this->projectId)->update(['scan_status' => 'failed']);
        Project::where('id', $this->projectId)->update([
            'scan_status'     => 'failed',
            'scan_finished_at' => now(),
            'scan_error'      => $message,
        ]);
        Cache::put($this->cacheKey, [
            'progress' => 0,
            'status'   => 'failed',
            'message'  => $message,
        ], now()->addHours(12));
    }
}
