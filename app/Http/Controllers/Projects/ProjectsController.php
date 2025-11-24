<?php

namespace App\Http\Controllers\Projects;

use App\Http\Controllers\Controller;
use App\Http\Requests\Projects\ProfileStoreRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectsController extends Controller
{
    /**
     * Show the user's projects page.
     */
    public function index(Request $request): Response
    {
        $projects = Project::withCount([
            'images as images_count' => function ($query) {
                $query;
            },
            'images as processed_images' => function ($query) {
                $query->whereIn('status', ['design', 'author', 'replaced']);
            },
            'images as not_processed_images' => function ($query) {
                $query->where('status',  'raw');
            },
        ])->paginate(30);


        return Inertia::render('projects', [
            'projects' =>   $projects,
            'status' => $request->session()->get('status'),
        ]);
    }


    public function store(ProfileStoreRequest $request): RedirectResponse
    {
        $data = $request->validated();

        Project::create($data);

        return redirect()
            ->route('projects.index')
            ->with('success', 'Проект успешно создан!');
    }


    /**
     * Show the user's projects page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('projects', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * 
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        return redirect()
            ->route('projects.index')
            ->with('success', 'Проект успешно создан!');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        return redirect()
            ->route('projects.index')
            ->with('success', 'Проект успешно создан!');
    }
}
