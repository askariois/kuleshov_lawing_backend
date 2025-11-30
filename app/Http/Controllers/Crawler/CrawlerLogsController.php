<?php

namespace App\Http\Controllers\Crawler;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CrawledLogs;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CrawlerLogsController extends Controller
{


   public function index(Request $request, $id)
   {
      $query = CrawledLogs::where('project_id', $id);

      $search = $request->input('search');

      if ($search) {
         $query->where(function ($q) use ($search) {
            // 1. Поиск по полному URL
            $q->where('url', 'LIKE', "%{$search}%")

               // 2. Поиск по "человеческой" части URL (после домена)
               ->orWhereRaw('SUBSTRING_INDEX(url, "/", -1) LIKE ?', ["%{$search}%"])

               // 3. Поиск по последним двум сегментам (часто помогает)
               ->orWhereRaw('RIGHT(url, LENGTH(url) - LOCATE("/", url, LOCATE("/", url, 9) + 1)) LIKE ?', ["%{$search}%"])

               // 4. Поиск по кириллическому транслиту (очень важно!)
               ->orWhere('url', 'LIKE', "%" . Str::slug($search, '-') . "%");
         });
      }


      $logs = $query->paginate(100);

      // КЛЮЧЕВАЯ СТРОКА — сохраняем search при пагинации!
      if ($search !== null) {
         $logs->appends(['search' => $search]);
      }

      return Inertia::render('logs', [ // с большой буквы — по конвенции
         'logs'   => $logs,
         'search' => $search ?? '', // всегда строка, даже если null
      ]);
   }
}
