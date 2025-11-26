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
      if (is_string($id)) {
         $id = json_decode($id, true);
      }
      $images = Image::with('locations')
         ->where('project_id', $id)
         ->where('status', 'raw');

      if ($request->filled('search')) {
         $images->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($request->input('search')) . '%']);
      }

      if ($request->has('mime_type') && is_array($request->input('mime_type'))) {
         $images->whereIn('mime_type', $request->input('mime_type'));
      }


      $result = $images->paginate(1, ['*'], 'page', $page);
      $currentImageId = $result->count() > 0 ? $result->first()->id : null;
      return Inertia::render('primary-sorting', [
         'images' => $result,
         'currentImageId' => $currentImageId,
         'currentPage' => $result->currentPage(),
         'projectId' => $id,
         'filters' => [
            'search' => $request->input('search', ''),
            'mime_type' => $request->input('mime_type', []),
         ],
      ]);
   }


   public function storeSorting(Request $request, $id): HttpResponse
   {
      $status = $request->input('status');
      $projectId = $request->input('project_id') ?? $request->route('id');
      $image = Image::findOrFail($id);

      if ($status === 'process') {
         CheckImageDuplicates::dispatch($image);
      }
      // Если пришло как JSON-строка, декодируем
      if (is_string($projectId)) {
         $projectId = json_decode($projectId, true);
      }
      $image->update(['status' => $status]);
      $returnTo = $request->input('return_to', 'primary'); // по умолчанию — первичная
      // --- Восстанавливаем фильтры ---
      $currentPage = $request->input('page', 1);
      $search = $request->input('search', null);
      $mimeTypes = $request->input('mime_type', null);

      $query = Image::with('locations')
         ->where('project_id', $projectId)
         ->where('status', 'raw');

      if ($search) {
         $query->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($search) . '%']);
      }

      if (is_array($mimeTypes)) {
         $query->whereIn('mime_type', $mimeTypes);
      }

      // Пагинация
      $images = $query->paginate(1, ['*'], 'page', $currentPage);

      // Если на текущей странице пусто — переходим на первую
      if ($images->isEmpty() && $currentPage > 1) {
         $currentPage = 1;
         $images = $query->paginate(1, ['*'], 'page', $currentPage);
      }

      // Формируем URL с фильтрами и страницей
      $queryParams = [];
      if ($search) $queryParams['search'] = $search;
      if ($mimeTypes) $queryParams['mime_type'] = $mimeTypes;
      $queryParams['page'] = $currentPage;


      return Inertia::location($returnTo);
   }

   function sort_secondary($id, Request $request): Response
   {
      $page = $request->query('page', 1);

      $images = Image::with('locations', 'duplicate', 'duplicate.sources')
         ->where('project_id', $id)
         ->where('status', 'process')
         ->paginate(1, ['*'], 'page', $page);


      if ($request->filled('search')) {
         $images->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($request->input('search')) . '%']);
      }

      if ($request->has('mime_type') && is_array($request->input('mime_type'))) {
         $images->whereIn('mime_type', $request->input('mime_type'));
      }


      return Inertia::render('secondary-sorting', [
         'images' => $images,
         'currentPage' => $images->currentPage(),
         'projectId' => $id,
         'filters' => [
            'search' => $request->input('search', ''),
            'mime_type' => $request->input('mime_type', []),
         ],
      ]);
   }
}
