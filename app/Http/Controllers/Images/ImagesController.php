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
        // === ФИЛЬТР ПО MIME_TYPE ===

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($search) . '%']);
        }

        if ($request->has('mime_type') && is_array($request->input('mime_type'))) {
            $query->whereIn('mime_type', $request->input('mime_type'));
        }

        // Пагинация с сохранением параметров
        $images = $query->paginate(15)->withQueryString();

        $raw_count = (clone $query)->where('status', 'raw')->count();
        $process =   Image::with('locations')->where('project_id', $id)->where('status', 'process')->count();
        $mimeTypes = Image::where('project_id', $id)
            ->whereNotNull('mime_type')
            ->distinct()
            ->pluck('mime_type')
            ->map(fn($mime) => [
                'value' => $mime,
                'label' => strtoupper(str_replace('image/', '', $mime)), // "image/jpeg" → "JPEG"
            ])
            ->values();


        return Inertia::render('images', [
            'images' =>   $images,
            'raw_count' =>   $raw_count,
            'process' =>   $process,
            'mimeTypes' => $mimeTypes,
            'filters' => [
                'mime' => request('mime_type', []) // ← массив
            ],
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
