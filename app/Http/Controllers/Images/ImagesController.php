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
        $images = Image::with('locations')->where('project_id', $id)->paginate(15);


        return Inertia::render('images', [
            'images' =>   $images,
            'status' => $request->session()->get('status'),
        ]);
    }
}
