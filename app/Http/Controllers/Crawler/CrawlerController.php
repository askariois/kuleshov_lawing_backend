<?php

namespace App\Http\Controllers\Crawler;

use App\Http\Controllers\Controller;
use App\Jobs\BrowsershotPageCrawlerJob;
use App\Jobs\PlaywrightPageCrawlerJob;
use Illuminate\Http\Request;
use App\Jobs\SiteCrawlerJob;
use App\Jobs\SitemapJob;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Spatie\Browsershot\Browsershot;

class CrawlerController extends Controller
{
   public function startScan(Request $request, Project $project)
   {
      $startUrl = $request->input('url', 'https://kuleshov.studio'); // Или из проекта
      $projectId = $request->input('project_id', 1); // Предполагаем project_id
      $redirectTo = $request->return_url;

      if (in_array($project->scan_status, ['pending', 'running'])) {
         return back()->with('error', 'Сайт уже сканируется');
      }


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
}
