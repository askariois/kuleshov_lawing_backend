<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Spatie\Crawler\Crawler;
use Spatie\Crawler\CrawlProfiles\CrawlInternalUrls;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\UriInterface;
use GuzzleHttp\Exception\RequestException;
use Symfony\Component\DomCrawler\Crawler as DomCrawler;
use GuzzleHttp\Client;
use App\Models\Image;
use App\Models\ImageLocation;
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
      // Инициализация прогресса: 0%, общее неизвестно, так что будем считать по обработанным страницам
      Cache::put($this->cacheKey, ['progress' => 0, 'total_pages' => 0, 'processed_pages' => 0, 'status' => 'running'], now()->addHours(1));

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
         }

         // public function willCrawl(UriInterface $url, ?UriInterface $foundOnUrl = null): void
         // {
         //    // Пустая реализация для совместимости
         // }

         public function crawled(UriInterface $url, ResponseInterface $response, ?UriInterface $foundOnUrl = null, ?string $linkText = null): void
         {
            $this->processedPages++;
            $this->updateProgress();

            $html = (string) $response->getBody();
            $dom = new DomCrawler($html, (string) $url);

            $images = $dom->filter('img')->each(function (DomCrawler $node) {
               return $node->attr('src');
            });

            foreach ($images as $src) {
               if (empty($src)) continue;

               // Превращаем строку в объект Uri
               $relativeUri = new Uri($src);

               // Превращаем базовый URL (страницу, где нашли картинку) в Uri
               $baseUri = new Uri($url);

               // Склеиваем относительный путь с базовым URL
               $imageUri = UriResolver::resolve($baseUri, $relativeUri);

               $imageUrl = (string) $imageUri;

               // Проверяем, что хост тот же
               if (parse_url($imageUrl, PHP_URL_HOST) !== parse_url($this->startUrl, PHP_URL_HOST)) {
                  continue;
               }

               // Получаем метаданные без скачивания (HEAD запрос)
               try {
                  $imageResponse = $this->httpClient->head($imageUrl);
                  $mimeType = $imageResponse->getHeaderLine('Content-Type') ?: 'image/unknown';
                  $size = (int) $imageResponse->getHeaderLine('Content-Length') ?: 0;

                  // Генерируем имя и путь (path теперь = URL, так как не скачиваем)
                  $extension = pathinfo($imageUri->getPath(), PATHINFO_EXTENSION) ?: 'jpg';
                  $name = Str::slug(pathinfo($imageUri->getPath(), PATHINFO_FILENAME)) . '.' . $extension;
                  $path = $imageUrl; // Используем URL как path

                  // Сохраняем в БД
                  $image = Image::firstOrCreate(
                     ['path' => $path, 'project_id' => $this->projectId],
                     [
                        'name' => $name,
                        'mime_type' => $mimeType,
                        'size' => $size,
                        'status' => 'processed',
                     ]
                  );

                  ImageLocation::firstOrCreate([
                     'image_id' => $image->id,
                     'url' => $imageUrl,
                  ]);
               } catch (\Exception $e) {
                  // Логируем ошибку
                  Log::error("Ошибка обработки изображения $imageUrl: " . $e->getMessage());
               }
            }
         }

         public function crawlFailed(UriInterface $url, RequestException $exception, ?UriInterface $foundOnUrl = null, ?string $linkText = null): void
         {
            $this->processedPages++;
            $this->updateProgress();
            Log::error("Ошибка краулинга $url: " . $exception->getMessage());
         }

         public function finishedCrawling(): void
         {
            Cache::put($this->cacheKey, ['progress' => 100, 'total_pages' => $this->processedPages, 'processed_pages' => $this->processedPages, 'status' => 'completed'], now()->addHours(1));
         }

         private function updateProgress()
         {
            // Поскольку общее кол-во страниц неизвестно заранее, используем эвристику: прогресс на основе обработанных (например, предполагаем макс 100 страниц, или адаптируем)
            // Для простоты: пока не 100%, ставим прогресс как (processed / estimated_total) * 100, но estimated_total обновляем из очереди краулера (но в Spatie нет прямого доступа)
            // Альтернатива: просто считать processed, а фронт пусть показывает "Обработано X страниц..."
            // Для процентов: давайте предположим max_pages из конфига, и используем его как total
            $data = Cache::get($this->cacheKey);
            $total = $data['total_pages'] ?: 100; // Default estimate, или взять из настроек
            $progress = min(100, ($this->processedPages / $total) * 100);
            Cache::put($this->cacheKey, ['progress' => $progress, 'total_pages' => $total, 'processed_pages' => $this->processedPages, 'status' => 'running'], now()->addHours(1));
         }
      };

      Crawler::create([
         'headers' => ['User-Agent' => 'SiteCrawlerBot/1.0'],
      ])
         ->ignoreRobots()
         ->setCrawlObserver($observer)
         ->setCrawlProfile(new CrawlInternalUrls($this->startUrl))
         ->setMaximumDepth(3)
         ->setConcurrency(5)
         ->startCrawling($this->startUrl);
   }
}
