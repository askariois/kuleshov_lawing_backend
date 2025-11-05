<?php

namespace App\Http\Controllers\Sort;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Response;
use Illuminate\Http\Response as HttpResponse;
use App\Jobs\CheckImageDuplicates;
use App\Models\Image;
use Inertia\Inertia;

class SortController extends Controller
{

   function sort($id, Request $request): Response
   {
      $page = $request->query('page', 1);

      $images = Image::with('locations')
         ->where('project_id', $id)
         ->where('status', 'raw')
         ->paginate(1, ['*'], 'page', $page);

      return Inertia::render('primary-sorting', [
         'images' => $images,
         'currentPage' => $images->currentPage(),
         'projectId' => $id,
      ]);
   }


   public function storeSorting(Request $request, $id): HttpResponse
   {
      $status = $request->input('status');
      $projectId = $request->input('project_id') ?? $request->route('id');
      $image = Image::findOrFail($id);

      if ($status == "process") {
         CheckImageDuplicates::dispatch($image);
      }


      Image::where('id', $id)->update(['status' => $status]);
      // Определяем следующую страницу
      $currentPage = $request->input('page', 1);
      $nextPage = $currentPage;

      $images = Image::with('locations')
         ->where('project_id', $projectId)
         ->where('status', 'raw')
         ->paginate(1, ['*'], 'page', $nextPage);

      // Если пусто — переходим на страницу 1
      if ($images->isEmpty() && $currentPage > 1) {
         $nextPage = 1;
         $images = Image::with('locations')
            ->where('project_id', $projectId)
            ->where('status', 'raw')
            ->paginate(1, ['*'], 'page', $nextPage);
      }


      return Inertia::location("/primary-sorting/{$projectId}?page={$nextPage}");
   }

   function sort_secondary($id, Request $request): Response
   {
      $page = $request->query('page', 1);

      $images = Image::with('locations', 'duplicate')
         ->where('project_id', $id)
         ->where('status', 'process')
         ->paginate(1, ['*'], 'page', $page);

      return Inertia::render('secondary-sorting', [
         'images' => $images,
         'currentPage' => $images->currentPage(),
         'projectId' => $id,
      ]);
   }
}
