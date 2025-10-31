<?php

namespace App\Http\Controllers\Images;

use App\Http\Controllers\Controller;
use App\Models\Image;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class ImagesController extends Controller
{
    function index(Request $request, $id): Response
    {
        $images = Image::with('locations');

        $images =   $images->where('project_id', $id)->paginate(15);
        $raw =   Image::with('locations')->where('project_id', $id)->where('status', 'raw')->count();


        return Inertia::render('images', [
            'images' =>   $images,
            'raw' =>   $raw,
            'status' => $request->session()->get('status'),
        ]);
    }


    function customer_request(Request $request, $id): Response
    {
        $images = Image::with('locations');
        $images =   $images->where('project_id', $id)->where('status', 'clent')->paginate(15);
        return Inertia::render('costumer-request', [
            'images' =>   $images,
            'status' => $request->session()->get('status'),
        ]);
    }

    function primary_sorting($id, Request $request): Response
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


    public function primarySort(Request $request, $id): HttpResponse
    {
        $status = $request->input('status');
        $projectId = $request->input('project_id') ?? $request->route('id');

        $updated = Image::where('id', $id)->update(['status' => $status]);

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
}
