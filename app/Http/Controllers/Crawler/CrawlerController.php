<?php

namespace App\Http\Controllers\Crawler;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Jobs\SiteCrawlerJob;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class CrawlerController extends Controller
{
   public function startScan(Request $request): RedirectResponse
   {
      $startUrl = $request->input('url', 'https://kuleshov.studio'); // Или из проекта
      $projectId = $request->input('project_id', 1); // Предполагаем project_id

      SiteCrawlerJob::dispatch($startUrl, $projectId);

      return redirect()
         ->route('projects.index')
         ->with('success', 'Сканирование запущено!');
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
