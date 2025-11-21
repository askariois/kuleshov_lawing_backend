<?php

namespace App\Http\Controllers\Images;

use App\Http\Controllers\Controller;
use App\Models\Image;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ImagesController extends Controller
{


    function index(Request $request, $id): Response
    {
        $query = Image::with('locations')->where('project_id', $id);

        // === ПОИСК ПО ИМЕНИ ===
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($search) . '%']);
        }

        // === ФИЛЬТР ПО MIME_TYPE ===
        if ($request->has('mime_type') && is_array($request->input('mime_type'))) {
            $query->whereIn('mime_type', $request->input('mime_type'));
        }

        // === НОВОЕ: ФИЛЬТР ПО СТАТУСУ ===
        if ($request->query('status') === 'raw') {
            $query->where('status', 'raw');
        } elseif ($request->query('status') === 'process') {
            $query->where('status', 'process');
        } elseif ($request->query('status') === 'free') {
            $query->where('status', 'free');
        }
        // если status не передан или другой — показываем все

        // Пагинация с сохранением всех GET-параметров
        $images = $query->paginate(15)->withQueryString();

        // Счётчики (можно оптимизировать, если нужно)
        $raw_count = Image::where('project_id', $id)->where('status', 'raw')->count();
        $process_count = Image::where('project_id', $id)->where('status', 'process')->count();

        $mimeTypes = Image::where('project_id', $id)
            ->whereNotNull('mime_type')
            ->distinct()
            ->pluck('mime_type')
            ->map(fn($mime) => [
                'value' => $mime,
                'label' => strtoupper(str_replace('image/', '', $mime)),
            ])
            ->values();

        return Inertia::render('images', [
            'images'      => $images,
            'raw_count'   => $raw_count,
            'process'     => $process_count,
            'mimeTypes'   => $mimeTypes,
            'filters'     => [
                'search'    => $request->query('search'),
                'mime'      => $request->query('mime_type', []),
                'status'    => $request->query('status'),
            ],
            'status'      => $request->session()->get('status'),
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

    function tor(Request $request, $id): Response
    {
        $images = Image::with('locations');
        $images =   $images->where('project_id', $id)->where('status', 'ToR')->paginate(15);
        return Inertia::render('tor', [
            'images' =>   $images,
            'status' => $request->session()->get('status'),
        ]);
    }

    function queue(Request $request, $id): Response
    {
        $images = Image::with('locations');
        $images =   $images->where('project_id', $id)->where('status', 'queue')->paginate(15);
        return Inertia::render('queue', [
            'images' =>   $images,
            'status' => $request->session()->get('status'),
        ]);
    }

    function single(Request $request,  $single): Response
    {
        $image =  Image::with('locations', 'duplicate')->find($single);

        return Inertia::render('single', [
            'image' =>   $image,
            'status' => $request->session()->get('status'),
        ]);
    }
}
