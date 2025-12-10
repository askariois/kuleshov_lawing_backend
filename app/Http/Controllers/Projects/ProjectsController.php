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
use OpenAI;

class ProjectsController extends Controller
{
    /**
     * Show the user's projects page.
     */
    public function index(Request $request): Response
    {
        $projects = Project::with('subdomains')->withCount([
            'subdomains as subdomains_count',
            'pages as pages_count',
            'images as images_count' => function ($query) {
                $query;
            },
            'images as processed_images' => function ($query) {
                $query->where('status', "!=", 'raw');
            },
            'images as not_processed_images' => function ($query) {
                $query->where('status',  'raw');
            },
        ])->whereNull('parent_id')->paginate(30);


        return Inertia::render('projects', [
            'projects' =>   $projects,
            'status' => $request->session()->get('status'),
        ]);
    }


    public function subdomains(Request $request, $id): Response
    {
        $projects = Project::with('subdomains')->withCount([
            'pages as pages_count',
            'images as images_count' => function ($query) {
                $query;
            },
            'images as processed_images' => function ($query) {
                $query->where('status', "!=", 'raw');
            },
            'images as not_processed_images' => function ($query) {
                $query->where('status',  'raw');
            },
        ])->where('parent_id', $id)->paginate(30);


        $parent_project =  Project::with('subdomains')->whereNull('parent_id')->find($projects->first()->parent_id);


        return Inertia::render('subdomains', [
            'projects' =>   $projects,
            'project_parent' =>  $parent_project,
            'status' => $request->session()->get('status'),
        ]);
    }



    public function store(ProfileStoreRequest $request)
    {
        $data = $request->validated();
        $redirectTo = $request->return_url;
        Project::create($data);

        return Inertia::location($redirectTo); // ← Это правильный способ!
    }


    /**
     * Show the user's projects page.
     */
    public function edit(Request $request, Project $project): Response
    {
        return Inertia::render('projects', [
            'status' => $request->session()->get('status'),
            'editProject' => $project,
        ]);
    }

    /**
     * 
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request, Project $project): RedirectResponse
    {
        $project->update($request->validated());
        $client = OpenAI::client(config('services.openai.key'));

        // === 1. Создаём/обновляем PROMPT (это и есть "ассистент", только в новой API) ===
        if (!$project->openai_prompt_id) {
            $prompt = $client->responses()->create([
                'model'        => 'gpt-5',
                'input'        => 'Инициализация системного промпта',
                'instructions' => $request->ai_description,
                'tools'        => [
                    ['type' => 'web_search'], // если хочешь, чтобы помнил старые фото
                ],
            ]);

            $project->openai_prompt_id = $prompt->id;
        }

        // === 2. Создаём CONVERSATION (это вечная память проекта) ===
        if (! $project->openai_conversation_id) {
            $conversation = $client->conversations()->create([]);
            $project->openai_conversation_id = $conversation->id;
        }

        $project->update([
            'name' => $request->name ?? $project->name,
            'description' => $request->prompt, // можно хранить черновик
        ]);

        return back()->with('success', 'Настройки и ИИ сохранены (Responses API)');
        return redirect()
            ->route('projects.index')
            ->with('success', 'Проект успешно обновлён!');
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
