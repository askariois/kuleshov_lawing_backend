<?php

namespace App\Http\Controllers\Crawler;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CrawledLogs;
use Inertia\Inertia;
use Inertia\Response;

class CrawlerLogsController extends Controller
{
   public function index(Request $request, $id): Response
   {
      $logs = CrawledLogs::where('project_id', $id)->paginate(20);

      return Inertia::render('logs', [
         'logs' =>   $logs,
         'status' => $request->session()->get('status'),
      ]);
   }
}
