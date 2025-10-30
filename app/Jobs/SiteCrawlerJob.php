<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Spatie\Crawler\Crawler;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\UriInterface;
use GuzzleHttp\Exception\RequestException;
use Symfony\Component\DomCrawler\Crawler as DomCrawler;
use GuzzleHttp\Client;
use App\Models\Image;
use App\Models\ImageLocation;
use App\Models\Project;
use GuzzleHttp\Psr7\Uri;
use GuzzleHttp\Psr7\UriResolver;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SiteCrawlerJob implements ShouldQueue
{
   use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

   protected $startUrl;
   protected $projectId;
   protected $cacheKey;

   public function __construct($startUrl, $projectId)
   {
      $this->startUrl = $startUrl;
      $this->projectId = $projectId;
      $this->cacheKey = 'crawler_progress_' . $this->projectId;
   }

   public function handle()
   {
      // Инициализация
      Cache::put($this->cacheKey, [
         'progress' => 0,
         'processed_pages' => 0,
         'total_pages' => 0,
         'status' => 'running'
      ], now()->addHours(1));

      $observer = new class($this->startUrl, $this->projectId, $this->cacheKey) extends \Spatie\Crawler\CrawlObservers\CrawlObserver {
         private $httpClient;
         private $startUrl;
         private $projectId;
         private $cacheKey;
         private $processedPages = 0;

         public function __construct($startUrl, $projectId, $cacheKey)
         {
            $this->startUrl = $startUrl;
            $this->projectId = $projectId;
            $this->cacheKey = $cacheKey;
            $this->httpClient = new Client([
               'timeout' => 10,
               'allow_redirects' => true,
               'verify' => false,
            ]);
            $this->processedPages = 0;
         }

         public function crawled(UriInterface $url, ResponseInterface $response, ?UriInterface $foundOnUrl = null, ?string $linkText = null): void
         {
            $this->processedPages++;
            $this->updateProgress();

            // === Обработка изображений ===
            $html = (string) $response->getBody();
            $dom = new DomCrawler($html, (string) $url);

            $images = $dom->filter('img')->each(fn($node) => $node->attr('src'));

            foreach ($images as $src) {
               if (empty($src)) continue;

               $relativeUri = new Uri($src);
               $baseUri = new Uri($url);
               $imageUri = UriResolver::resolve($baseUri, $relativeUri);
               $imageUrl = (string) $imageUri;

               // Пропускаем внешние домены
               if (parse_url($imageUrl, PHP_URL_HOST) !== parse_url($this->startUrl, PHP_URL_HOST)) {
                  continue;
               }

               try {
                  $head = $this->httpClient->head($imageUrl);
                  $mime = $head->getHeaderLine('Content-Type') ?: 'image/unknown';
                  $contentLength = (int) $head->getHeaderLine('Content-Length') ?: 0;

                  // === Получаем размеры изображения (через GET + getimagesizefromstring) ===
                  $imageResponse = $this->httpClient->get($imageUrl);
                  $imageData = $imageResponse->getBody()->getContents();

                  $sizeInfo = @getimagesizefromstring($imageData);
                  $width = $sizeInfo[0] ?? null;
                  $height = $sizeInfo[1] ?? null;

                  // === Генерируем имя и путь ===
                  $ext = pathinfo($imageUri->getPath(), PATHINFO_EXTENSION) ?: 'jpg';
                  $name = Str::slug(pathinfo($imageUri->getPath(), PATHINFO_FILENAME)) . '.' . $ext;
                  $path = $imageUrl;

                  // === Сохраняем изображение с размерами ===
                  $image = Image::firstOrCreate(
                     ['path' => $path, 'project_id' => $this->projectId],
                     [
                        'name' => $name,
                        'mime_type' => $mime,
                        'size' => $contentLength,
                        'width' => $width,
                        'height' => $height,
                        'dimensions' => $width && $height ? ['width' => $width, 'height' => $height] : null,
                        'status' => 'raw',
                     ]
                  );

                  // === Сохраняем местоположение: URL страницы, где найдено ===
                  ImageLocation::firstOrCreate([
                     'image_id' => $image->id,
                     'url' => (string) $url, // ← Это URL текущей страницы!
                  ]);
               } catch (\Exception $e) {
                  Log::warning("Image processing failed for $imageUrl: " . $e->getMessage());
               }
            }
         }

         public function crawlFailed(UriInterface $url, RequestException $exception, ?UriInterface $foundOnUrl = null, ?string $linkText = null): void
         {
            $this->processedPages++;
            $this->updateProgress();
            Log::error("Crawl failed: $url — " . $exception->getMessage());
         }

         public function finishedCrawling(): void
         {
            // НЕ ставим progress = 100
            // Оставляем последний рассчитанный progress (например, 95%)
            // Меняем только статус

            Project::where('id', $this->projectId)->update(['last_scan' => now()]);

            $lastData = Cache::get($this->cacheKey, [
               'progress' => 0,
               'processed_pages' => $this->processedPages,
               'total_pages' => 0,
               'status' => 'running'
            ]);

            Cache::put($this->cacheKey, [
               'progress' => $lastData['progress'], // оставляем как есть
               'processed_pages' => $this->processedPages,
               'total_pages' => $lastData['total_pages'],
               'status' => 'completed'
            ], now()->addHours(1));
         }

         private function updateProgress(): void
         {
            // Оценочный прогресс: processed * 3 → минимум 50
            $estimatedTotal = max(50, $this->processedPages * 3);
            $progress = $this->processedPages > 0
               ? min(99, round(($this->processedPages / $estimatedTotal) * 100, 1))
               : 0;

            Cache::put($this->cacheKey, [
               'progress' => $progress,
               'processed_pages' => $this->processedPages,
               'total_pages' => $estimatedTotal,
               'status' => 'running'
            ], now()->addHours(1));
         }
      };

      Crawler::create([
         'headers' => ['User-Agent' => 'SiteCrawlerBot/1.0'],
      ])
         ->ignoreRobots()
         ->setCrawlObserver($observer)
         ->setCrawlProfile(new \App\Crawler\CustomCrawlProfile($this->startUrl))
         ->setMaximumDepth(10)
         ->setConcurrency(5)
         ->startCrawling($this->startUrl);
   }
}
