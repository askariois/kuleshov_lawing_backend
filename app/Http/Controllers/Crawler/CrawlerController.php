<?php

namespace App\Http\Controllers\Crawler;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Jobs\SiteCrawlerJob;
use Illuminate\Support\Facades\Cache;

class CrawlerController extends Controller
{
   public function startScan(Request $request)
   {
      $startUrl = $request->input('url', 'https://kuleshov.studio'); // Или из проекта
      $projectId = $request->input('project_id', 1); // Предполагаем project_id

      SiteCrawlerJob::dispatch($startUrl, $projectId);

      return response()->json(['message' => 'Сканирование запущено', 'project_id' => $projectId]);
   }

   public function getProgress(Request $request)
   {
      $projectId = $request->input('project_id', 1);
      $cacheKey = 'crawler_progress_' . $projectId;
      $progress = Cache::get($cacheKey, ['progress' => 0, 'status' => 'pending']);

      return response()->json($progress);
   }
}
