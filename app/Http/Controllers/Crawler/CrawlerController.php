<?php

namespace App\Http\Controllers\Crawler;

use App\Http\Controllers\Controller;
use App\Jobs\BrowsershotPageCrawlerJob;
use App\Jobs\PlaywrightPageCrawlerJob;
use Illuminate\Http\Request;
use App\Jobs\SiteCrawlerJob;
use App\Jobs\SitemapJob;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Spatie\Browsershot\Browsershot;

class CrawlerController extends Controller
{
   public function startScan(Request $request)
   {
      $startUrl = $request->input('url', 'https://kuleshov.studio'); // Или из проекта
      $projectId = $request->input('project_id', 1); // Предполагаем project_id
      $redirectTo = $request->return_url;


      SiteCrawlerJob::dispatch($startUrl,  $projectId);

      return Inertia::location($redirectTo);
   }


   public function startScan_2(Request $request)
   {
      $startUrl = $request->input('url', 'https://kuleshov.studio'); // Или из проекта
      $projectId = $request->input('project_id', 1); // Предполагаем project_id
      $redirectTo = $request->return_url;


      SitemapJob::dispatch($startUrl,  $projectId)->onQueue('sitemap');

      return Inertia::location($redirectTo);
   }


   public function getProgress(Request $request)
   {
      $projectId = $request->query('project_id');

      $cache = Cache::get("crawler_progress_{$projectId}", [
         'progress' => 0,
         'processed_pages' => 0,
         'total_pages' => 0,
         'total_images' => 0,
         'status' => 'idle'
      ]);

      return response()->json($cache);
   }
}
