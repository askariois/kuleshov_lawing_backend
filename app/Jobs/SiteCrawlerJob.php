<?php

namespace App\Jobs;

use App\Jobs\ProcessImageChunkJob;
use App\Models\CrawledLogs;
use App\Models\Image;
use App\Models\Project;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Spatie\Crawler\Crawler;
use Spatie\Crawler\CrawlProfiles\CrawlProfile;
use Psr\Http\Message\UriInterface;
use Psr\Http\Message\ResponseInterface;
use GuzzleHttp\Exception\RequestException;
use Symfony\Component\DomCrawler\Crawler as DomCrawler;
use GuzzleHttp\Client;
use GuzzleHttp\Psr7\Uri;
use GuzzleHttp\Psr7\UriResolver;
use Throwable;

class SiteCrawlerJob implements ShouldQueue
{
   use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

   // Laravel job settings
   public $timeout = 7200; // total job timeout
   public $tries   = 5;
   public $backoff = [30, 60, 120, 300, 600];

   protected string $startUrl;
   protected int $projectId;
   protected string $cacheKey;

   // Configuration (tune as needed)
   protected int $pageLimit = 1000; // max pages to crawl per job
   protected int $imageChunkSize = 40; // how many images per ProcessImageChunkJob
   protected int $concurrency = 2;
   protected int $maximumDepth = 2;
   protected int $delayBetweenRequestsMs = 200; // ms between requests
   protected int $guzzleTimeout = 15;
   protected int $guzzleConnectTimeout = 10;

   public function __construct(string $startUrl, int $projectId)
   {
      $this->startUrl = rtrim($startUrl, '/');
      $this->projectId = $projectId;
      $this->cacheKey = 'crawler_progress_' . $projectId;
   }

   public function handle(): void
   {


      Project::where('id', $this->projectId)->update([
         'scan_status' => 'running',
         'scan_started_at' => now(),
         'scan_finished_at' => null,
         'scan_error' => null,
      ]);
      // initialize progress cache (minimal DB work in the crawl loop)
      Cache::put($this->cacheKey, [
         'progress' => 0,
         'processed_pages' => 0,
         'total_pages' => 0,
         'total_images_estimated' => 0,
         'status' => 'running',
         'message' => null,
      ], now()->addHours(2));

      // Guzzle client used only for fetching pages (no HEAD checks here).
      $client = new Client([
         'timeout' => $this->guzzleTimeout,
         'connect_timeout' => $this->guzzleConnectTimeout,
         'allow_redirects' => ['max' => 5],
         'verify' => false,
         'http_errors' => false,
         'headers' => [
            'User-Agent' => 'Mozilla/5.0 (compatible; SiteCrawlerBot/1.0)',
            'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
         ],
      ]);

      // Create an anonymous CrawlObserver with page limit, internal counters, and light-weight operations.
      $observer = new class(
         $this->startUrl,
         $this->projectId,
         $this->cacheKey,
         $this->imageChunkSize,
         $this->pageLimit
      ) extends \Spatie\Crawler\CrawlObservers\CrawlObserver {

         private string $startUrl;
         private int $projectId;
         private string $cacheKey;
         private int $imageChunkSize;
         private int $pageLimit;

         private int $processedPages = 0;
         private int $estimatedImages = 0;
         private string $host;

         public function __construct(string $startUrl, int $projectId, string $cacheKey, int $imageChunkSize, int $pageLimit)
         {
            $this->startUrl = $startUrl;
            $this->projectId = $projectId;
            $this->cacheKey = $cacheKey;
            $this->imageChunkSize = $imageChunkSize;
            $this->pageLimit = $pageLimit;
            $this->host = parse_url($startUrl, PHP_URL_HOST) ?: '';
         }

         /**
          * Called when a URL was crawled successfully.
          *
          * We purposely do NOT perform HEAD requests here to avoid making many synchronous calls
          * that produce cURL timeouts. Instead we collect and normalize image URLs and dispatch
          * ProcessImageChunkJob for later validation and processing.
          *
          * @param UriInterface $url
          * @param ResponseInterface $response
          * @param UriInterface|null $foundOnUrl
          * @param string|null $linkText
          * @return void
          */
         public function crawled(UriInterface $url, ResponseInterface $response, ?UriInterface $foundOnUrl = null, ?string $linkText = null): void
         {
            $this->processedPages++;
            $pageUrl = (string) $url;

            try {
               // quick check: only process HTML responses
               $contentType = $response->getHeaderLine('Content-Type') ?: '';
               if (!str_contains($contentType, 'text/html')) {
                  // save log minimal info and return
                  CrawledLogs::updateOrCreate(
                     ['project_id' => $this->projectId, 'url' => $pageUrl],
                     [
                        'images_count' => 0,
                        'status' => 'success',
                        'error' => null,
                        'crawled_at' => now(),
                     ]
                  );

                  $this->updateProgress();
                  $this->maybeStopIfLimitReached();
                  return;
               }

               $html = (string) $response->getBody();

               // avoid extremely large pages; if too big, skip parsing to save memory/time
               $maxHtmlSizeBytes = 1024 * 1024 * 3; // 3 MB
               if (strlen($html) > $maxHtmlSizeBytes) {
                  CrawledLogs::updateOrCreate(
                     ['project_id' => $this->projectId, 'url' => $pageUrl],
                     [
                        'images_count' => 0,
                        'status' => 'success',
                        'error' => null,
                        'crawled_at' => now(),
                     ]
                  );

                  $this->updateProgress();
                  $this->maybeStopIfLimitReached();
                  return;
               }

               $dom = new DomCrawler($html, $pageUrl);

               // collect image src attributes
               $imageUrls = $dom->filter('img[src]')
                  ->reduce(function ($node) {
                     $src = trim($node->attr('src') ?? '');
                     return $src !== '';
                  })
                  ->each(function ($node) use ($url) {
                     $src = (string) $node->attr('src');
                     return $this->resolveImageUrl($src, $url);
                  });

               // normalize and unique
               $imageUrls = array_values(array_filter(array_unique($imageUrls)));

               // keep only images from same host to avoid remote domains (configurable)
               $imageUrls = array_values(array_filter($imageUrls, function ($imgUrl) {
                  $imageHost = parse_url($imgUrl, PHP_URL_HOST) ?: $this->host;

                  // Если это наш хост — ок, сохраняем
                  if (strtolower($imageHost) === strtolower($this->host)) {
                     return true;
                  }

                  // Если это НЕ наш хост — проверяем: а не основной ли это домен?
                  $project = Project::find($this->projectId);
                  if (!$project || !$project->parent_id) {
                     return false; // основной домен — чужие изображения не берём
                  }

                  $parent = Project::select('url')->find($project->parent_id);
                  if (!$parent) {
                     return false;
                  }

                  $parentDomain = parse_url($parent->url ?? '', PHP_URL_HOST);
                  if (!$parentDomain) {
                     return false;
                  }

                  // Это изображение с основного домена — проверяем: а есть ли уже такое изображение у родителя?
                  if (strtolower($imageHost) === strtolower($parentDomain)) {
                     $path = parse_url($imgUrl, PHP_URL_PATH);
                     if (!$path) return true;

                     // Если у родителя уже есть изображение по этому пути — НЕ СОХРАНЯЕМ
                     $existsInParent = Image::where('project_id', $project->parent_id)
                        ->where('path', $path)
                        ->exists();

                     if ($existsInParent) {
                        return false; // уже есть у родителя → не дублируем
                     }
                  }

                  // Всё остальное — разрешаем (на всякий случай)
                  return true;
               }));

               $imagesCount = count($imageUrls);
               $this->estimatedImages += $imagesCount;

               // Save a lightweight log immediately: we assume images will be processed later
               CrawledLogs::updateOrCreate(
                  ['project_id' => $this->projectId, 'url' => $pageUrl],
                  [
                     'images_count' => $imagesCount,
                     'status' => 'success',
                     'error' => null,
                     'crawled_at' => now(),
                  ]
               );

               // dispatch image jobs in chunks; do not wait for results
               if ($imagesCount > 0) {
                  $chunks = array_chunk($imageUrls, $this->imageChunkSize);

                  foreach ($chunks as $chunk) {
                     // ProcessImageChunkJob should be responsible for validating URLs (HEAD/GET),
                     // downloading images, storing DB records, retries, and error handling.
                     ProcessImageChunkJob::dispatch($chunk, $pageUrl, $this->projectId)->onQueue('chank');
                  }
               }
            } catch (Throwable $e) {
               // Ensure we record an error for this page
               CrawledLogs::updateOrCreate(
                  ['project_id' => $this->projectId, 'url' => $pageUrl],
                  [
                     'images_count' => 0,
                     'status' => 'failed',
                     'error' => $e->getMessage(),
                     'crawled_at' => now(),
                  ]
               );
               Log::warning('Crawler parse error for URL: ' . $pageUrl . ' error: ' . $e->getMessage());
            }

            $this->updateProgress();
            $this->maybeStopIfLimitReached();
         }

         /**
          * Called when crawling a URL failed.
          *
          * @param UriInterface $url
          * @param RequestException $exception
          * @param UriInterface|null $foundOnUrl
          * @param string|null $linkText
          * @return void
          */
         public function crawlFailed(UriInterface $url, RequestException $exception, ?UriInterface $foundOnUrl = null, ?string $linkText = null): void
         {
            $this->processedPages++;
            $pageUrl = (string) $url;
            $statusCode = $exception->getResponse()?->getStatusCode() ?? 0;

            $status = match (true) {
               $statusCode >= 500 => 'timeout',
               in_array($statusCode, [403, 429]) => 'blocked',
               default => 'failed',
            };

            CrawledLogs::updateOrCreate(
               ['project_id' => $this->projectId, 'url' => $pageUrl],
               [
                  'images_count' => 0,
                  'status' => $status,
                  'error' => $exception->getMessage(),
                  'crawled_at' => now(),
               ]
            );

            $this->updateProgress();
            $this->maybeStopIfLimitReached();
         }

         /**
          * Called when crawling finished (normally or after we force stop).
          *
          * Here we update project metadata and set final status in cache. We avoid expensive DB counts here:
          * the real total_images will be recalculated separately if needed. We'll attempt a fast DB count,
          * but if the table is huge this can be slow — adjust according to your infra.
          *
          * @return void
          */
         public function finishedCrawling(): void
         {
            // Attempt to get actual images count quickly. If this is heavy, consider removing or moving
            // to a separate job to recalc totals.
            try {
               $totalImages = Image::where('project_id', $this->projectId)->count();
            } catch (Throwable $e) {
               // fallback to estimated value if count fails
               $totalImages = $this->estimatedImages;
               Log::warning('Image count failed during finishedCrawling: ' . $e->getMessage());
            }

            // Update project
            Project::where('id', $this->projectId)->update([
               'last_scan' => now(),
               'total_images' => $totalImages,
            ]);
            Project::where('id', $this->projectId)->update([
               'last_scan' => now(),
               'total_images' => $totalImages,
               'scan_status' => 'completed',
               'scan_finished_at' => now(),
            ]);
            // Update cache (final)
            Cache::put($this->cacheKey, [
               'progress' => 100,
               'processed_pages' => $this->processedPages,
               'total_pages' => $this->processedPages,
               'total_images_estimated' => $this->estimatedImages,
               'status' => 'completed',
               'message' => null,
            ], now()->addHours(2));
         }

         /**
          * Resolve relative/absolute image URL against page base URL.
          *
          * @param string $src
          * @param UriInterface $baseUrl
          * @return string
          */
         private function resolveImageUrl(string $src, UriInterface $baseUrl): string
         {
            // If src is already absolute (has scheme), UriResolver will keep it
            try {
               $relative = new Uri($src);
               $resolved = UriResolver::resolve($baseUrl, $relative);
               return (string) $resolved;
            } catch (Throwable $e) {
               // fallback: return as-is
               return trim($src);
            }
         }

         /**
          * Lightweight progress update stored in cache to minimize DB impact.
          *
          * @return void
          */
         private function updateProgress(): void
         {
            $estimatedRemaining = max(1, intdiv(max(1, $this->processedPages), 4)); // empirical
            $progress = $this->processedPages > 0
               ? min(99, (int) round(($this->processedPages / ($this->processedPages + $estimatedRemaining)) * 100))
               : 0;

            Cache::put($this->cacheKey, [
               'progress' => $progress,
               'processed_pages' => $this->processedPages,
               'total_pages' => $this->processedPages + $estimatedRemaining,
               'total_images_estimated' => $this->estimatedImages,
               'status' => 'running',
               'message' => null,
            ], now()->addHours(2));
         }

         /**
          * If processed pages reached configured limit, throw an exception to stop the crawler.
          * The outer job will catch it and call finishedCrawling() to finalize state.
          *
          * @return void
          * @throws \RuntimeException
          */
         private function maybeStopIfLimitReached(): void
         {
            if ($this->pageLimit > 0 && $this->processedPages >= $this->pageLimit) {
               // Throw a specific exception so caller can distinguish normal stop vs error
               throw new \RuntimeException('crawler_page_limit_reached');
            }
         }
      };

      // Provide a simple crawl profile that restricts crawling to the same host and allowed schemes.
      // If you already have a CustomCrawlProfile, you may replace this block with your own.
      $crawlProfile = new class($this->startUrl) extends  CrawlProfile {
         private string $startUrl;
         private string $startHost;

         public function __construct(string $startUrl)
         {
            $this->startUrl = $startUrl;
            $this->startHost = parse_url($startUrl, PHP_URL_HOST) ?: '';
         }

         public function shouldCrawl(UriInterface $url): bool
         {
            // allow only same host and http/https schemes
            $host = parse_url((string) $url, PHP_URL_HOST) ?: '';
            $scheme = parse_url((string) $url, PHP_URL_SCHEME) ?: '';
            if ($host === '' || $host !== $this->startHost) {
               return false;
            }
            if (!in_array($scheme, ['http', 'https'])) {
               return false;
            }

            return true;
         }
      };

      // Start crawling with safeguards. We catch the page-limit exception to finish gracefully.
      try {
         Crawler::create()
            ->setCrawlObserver($observer)
            ->setCrawlProfile($crawlProfile)
            ->setConcurrency($this->concurrency)
            ->setDelayBetweenRequests($this->delayBetweenRequestsMs)
            ->ignoreRobots()
            ->startCrawling($this->startUrl);

         // If crawler completes normally, observer->finishedCrawling() will be called by Spatie's internals.
      } catch (Throwable $e) {
         // If we hit the page limit, the observer has thrown 'crawler_page_limit_reached' exception.
         if ($e instanceof \RuntimeException && $e->getMessage() === 'crawler_page_limit_reached') {
            // finalize gracefully: call finishedCrawling on the observer to update project/cache.
            try {
               $observer->finishedCrawling();
            } catch (Throwable $finalizeEx) {
               Log::error('Failed to finalize crawler after page limit: ' . $finalizeEx->getMessage());
               // Ensure cache is set to completed with best-effort data
               $cached = Cache::get($this->cacheKey, []);
               $processedPages = $cached['processed_pages'] ?? 0;
               $estimatedImages = $cached['total_images_estimated'] ?? 0;
               Project::where('id', $this->projectId)->update([
                  'last_scan' => now(),
                  'total_images' => $estimatedImages,
               ]);

               Project::where('id', $this->projectId)->update([
                  'scan_status' => 'limited',
                  'scan_finished_at' => now(),
               ]);
               Cache::put($this->cacheKey, [
                  'progress' => 100,
                  'processed_pages' => $processedPages,
                  'total_pages' => $processedPages,
                  'total_images_estimated' => $estimatedImages,
                  'status' => 'completed_limited',
                  'message' => 'stopped_by_page_limit',
               ], now()->addHours(2));
            }
            return;
         }

         // Unexpected error: mark in cache and log
         Log::error('Crawler unexpected error: ' . $e->getMessage());
         $cached = Cache::get($this->cacheKey, []);
         $processedPages = $cached['processed_pages'] ?? 0;
         $estimatedImages = $cached['total_images_estimated'] ?? 0;


         Project::where('id', $this->projectId)->update([
            'last_scan' => now(),
            'total_images' => max($estimatedImages, Project::where('id', $this->projectId)->value('total_images') ?? 0),
            'scan_status' => 'failed',
            'scan_finished_at' => now(),
            'scan_error' => $e->getMessage(),
         ]);
         Cache::put($this->cacheKey, [
            'progress' => min(99, $cached['progress'] ?? 0),
            'processed_pages' => $processedPages,
            'total_pages' => $processedPages,
            'total_images_estimated' => $estimatedImages,
            'status' => 'failed',
            'message' => $e->getMessage(),
         ], now()->addHours(2));

         // rethrow to let Laravel know job failed (optional). If you prefer to swallow errors, remove the next line.
         throw $e;
      }
   }
}
