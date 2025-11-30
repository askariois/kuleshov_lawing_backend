<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Spatie\Browsershot\Browsershot;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Models\Image;
use App\Models\ImageLocation;
use App\Models\CrawledLogs;
use GuzzleHttp\Client;

class BrowsershotPageCrawlerJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 180;

    protected string $url;
    protected int $projectId;

    public function __construct(string $url, int $projectId)
    {
        $this->url = $url;
        $this->projectId = $projectId;
    }

    public function handle()
    {
        $normalizedUrl = $this->normalizeUrl($this->url);

        // Проверяем, есть ли уже запись в CrawledLogs по нормализованному URL
        $existingLog = CrawledLogs::where('project_id', $this->projectId)
            ->where('url', $this->url)
            ->exists();

        if ($existingLog) {
            return; // Пропускаем, если страница уже сканирована
        }

        try {
            $dataJson = Browsershot::url($this->url)
                ->waitUntilNetworkIdle()
                ->timeout(120)
                ->evaluate(<<<'JS'
JSON.stringify((() => {

    const urls = new Set();
    const links = new Set();

    const addUrl = (u) => {
        if (!u) return;
        u = u.trim();
        if (!u) return;

        if (u.startsWith('data:') || u.startsWith('blob:')) return;

        try {
            const abs = new URL(u, window.location.href).href;
            urls.add(abs);
        } catch {}
    };

    // <img>
    document.querySelectorAll('img').forEach(img => {
        ['src','data-src','data-lazy-src','data-original'].forEach(attr => {
            const u = img.getAttribute(attr);
            if (u) addUrl(u);
        });

        if (img.srcset) {
            img.srcset.split(',')
                .map(i => i.trim().split(' ')[0])
                .forEach(u => addUrl(u));
        }
    });

    // <picture><source>
    document.querySelectorAll('picture source[srcset], source[srcset], source[data-srcset]')
        .forEach(el => {
            const s = el.getAttribute('srcset') || el.getAttribute('data-srcset');
            if (s) {
                s.split(',').forEach(p => {
                    const u = p.trim().split(' ')[0];
                    if (u) addUrl(u);
                });
            }
        });

    // [data-srcset]
    document.querySelectorAll('[data-srcset]').forEach(el => {
        const val = el.getAttribute('data-srcset');
        if (val) {
            val.split(',').forEach(p => {
                const u = p.trim().split(' ')[0];
                if (u) addUrl(u);
            });
        }
    });

    // background-image (computed + inline)
    document.querySelectorAll('*').forEach(el => {
        const bg = getComputedStyle(el).backgroundImage;
        const m = bg && bg.match(/url\(["']?([^"')]+)["']?\)/);
        if (m && m[1]) addUrl(m[1]);

        const styleAttr = el.getAttribute('style');
        if (styleAttr) {
            const m2 = styleAttr.match(/background-image\s*:\s*url\(["']?([^"')]+)["']?\)/i);
            if (m2 && m2[1]) addUrl(m2[1]);
        }
    });

    // ссылки
    document.querySelectorAll('a[href]').forEach(a => {
        const href = a.getAttribute('href');
        if (!href) return;

        try {
            const abs = new URL(href, window.location.href).href;
            if (abs.startsWith('http') && !abs.includes('#')) {
                links.add(abs);
            }
        } catch {}
    });

    return { images: Array.from(urls), links: Array.from(links) };

})())
JS);

            $data = json_decode($dataJson, true);
            $images = $data['images'] ?? [];
            $links  = $data['links'] ?? [];

            $this->logPage('success', 200, count($images), null, $normalizedUrl);

            $this->processImages($images);
            $this->discoverNewUrls($links);
        } catch (\Throwable $e) {
            Log::error("Browsershot error on {$this->url}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $this->logPage('failed', 0, 0, $e->getMessage(), $normalizedUrl);
        }
    }

    private function processImages(array $urls): void
    {
        $allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'tif', 'tiff'];
        $allowedMime = '~^image/(jpeg|jpg|png|webp|gif|svg|bmp|tiff?)$~i';

        $client = new Client(['timeout' => 20, 'verify' => false]);

        foreach ($urls as $url) {

            if (!preg_match('~^https?://~i', $url)) continue;

            $path = parse_url($url, PHP_URL_PATH);
            if (!$path) continue;

            $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));

            if (!in_array($ext, $allowedExt, true)) continue;

            // есть ли в базе?
            $existing = Image::where('path', $url)
                ->where('project_id', $this->projectId)
                ->first();

            if ($existing) {

                ImageLocation::firstOrCreate([
                    'image_id' => $existing->id,
                    'url'      => $this->url,
                ]);

                if ($existing->size !== null) {
                    continue;
                }
            }

            try {
                $resp = $client->get($url);
                $mime = strtolower($resp->getHeaderLine('Content-Type'));

                if (!preg_match($allowedMime, $mime)) continue;

                $data = $resp->getBody()->getContents();
                $info = @getimagesizefromstring($data);

                if (!$info || !$info[0] || !$info[1]) continue;

                $image = Image::updateOrCreate(
                    [
                        'path'       => $url,
                        'project_id' => $this->projectId,
                    ],
                    [
                        'name'      => Str::slug(pathinfo($url, PATHINFO_FILENAME)) . '.' . $ext,
                        'mime_type' => $mime,
                        'size'      => strlen($data),
                        'width'     => $info[0],
                        'height'    => $info[1],
                        'status'    => 'raw',
                    ]
                );

                ImageLocation::firstOrCreate([
                    'image_id' => $image->id,
                    'url'      => $this->url,
                ]);
            } catch (\Throwable $e) {
                Log::info("Image download failed {$url}: " . $e->getMessage());
            }
        }
    }

    private function discoverNewUrls(array $links): void
    {
        $currentHost = parse_url($this->url, PHP_URL_HOST);

        foreach ($links as $url) {
            $host = parse_url($url, PHP_URL_HOST);
            $scheme = parse_url($url, PHP_URL_SCHEME);

            if (!$scheme || !in_array($scheme, ['http', 'https'], true)) continue;
            if ($host !== $currentHost) continue;


            // Проверяем по БД вместо кэша
            $existing = CrawledLogs::where('project_id', $this->projectId)
                ->where('url', $url)
                ->exists();

            if (!$existing) {
                self::dispatch($url, $this->projectId)
                    ->delay(now()->addSeconds(rand(1, 5)));
            }
        }
    }

    private function normalizeUrl(string $url): string
    {
        $parts = parse_url($url);

        $scheme = $parts['scheme'] ?? 'https';
        $host   = $parts['host']   ?? '';
        $path   = $parts['path']   ?? '/';

        // Убрать лишний / в конце
        if ($path !== '/' && str_ends_with($path, '/')) {
            $path = rtrim($path, '/');
        }

        // Список разрешённых query параметров
        $allowedParams = ['page', 'p'];

        $query = [];
        if (!empty($parts['query'])) {
            parse_str($parts['query'], $rawQuery);
            foreach ($rawQuery as $key => $value) {
                if (in_array($key, $allowedParams, true)) {
                    $query[$key] = $value;
                }
            }
        }

        ksort($query);

        $queryString = http_build_query($query);

        return $scheme . '://' . $host . $path . ($queryString ? '?' . $queryString : '');
    }

    private function logPage(string $status, int $code = 200, int $images = 0, ?string $err = null, ?string $normalizedUrl = null): void
    {
        CrawledLogs::updateOrCreate(
            [
                'project_id' => $this->projectId,
                'url'        => $this->url,
            ],
            [
                'images_count' => $images,
                'status'       => $status,
                'status_code'  => $code,
                'error'        => $err,
                'crawled_at'   => now(),
            ]
        );
    }
}
