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
        $images = Image::with('locations');
        $images =   $images->where('project_id', $id)->paginate(15);
        $raw =   Image::with('locations')->where('project_id', $id)->where('status', 'raw')->count();
        $process =   Image::with('locations')->where('project_id', $id)->where('status', 'process')->count();


        return Inertia::render('images', [
            'images' =>   $images,
            'raw' =>   $raw,
            'process' =>   $process,
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
}
