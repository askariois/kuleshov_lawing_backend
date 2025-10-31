<?php

namespace App\Http\Controllers\Images;

use App\Http\Controllers\Controller;
use App\Models\Image;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ImagesController extends Controller
{
    function index(Request $request, $id): Response
    {
        $images = Image::with('locations')->where('project_id', $id)->paginate(15);
        return Inertia::render('images', [
            'images' =>   $images,
            'status' => $request->session()->get('status'),
        ]);
    }

    function primary_sorting(Request $request, $id): Response
    {
        $images = Image::with('locations')->where('project_id', $id)->where('status', 'raw')->paginate(1);
        return Inertia::render('primary-sorting', [
            'images' => $images,
            'projectId' => $id,
            'currentPage' => $images->currentPage(), // ← ВОТ ЭТО!
        ]);
    }

    public function primarySort(Request $request, $id): RedirectResponse
    {
        $status = $request->input('status');

        // 1. Обновляем статус текущего изображения
        $updated = Image::with('locations')->where('id', $id)->update(['status' => $status]);

        // 2. Если обновление не удалось — возвращаем ошибку
        if (!$updated) {
            return redirect()
                ->route('primary.sorting.index', [
                    'id' => 1,
                    'page' => 1,
                ]);
        }

        $images = Image::with('locations')->where('project_id', 1)->where('status', 'raw')->paginate(1);

        // 7. Возвращаем страницу с новым изображением
        return redirect()
            ->route('primary.sorting.index', [
                'id' => 1,
                'page' => 1,
            ]);
        // return Inertia::render('primary-sorting', [
        //     'images' => $images,
        //     'success' => 'Статус обновлён. Следующее изображение.',
        // ]);
    }
}
