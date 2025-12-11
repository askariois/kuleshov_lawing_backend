<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use OpenAI;
use App\Models\Project;
use Exception;
use Illuminate\Support\Facades\Log;

class ProjectAIJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private int $projectId;
    private string $aiDescription;

    /**
     * Create a new job instance.
     */
    public function __construct(int $projectId, string $aiDescription)
    {
        $this->projectId = $projectId;
        $this->aiDescription = $aiDescription;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $client = OpenAI::client(config('services.openai.key'));

        // Находим проект (с учётом возможного удаления и т.д.)
        $project = Project::findOrFail($this->projectId);
        $project->update(['status' => "pending"]);

        try {
            // === 1. Создаём/обновляем PROMPT (Responses API) ===
            if (!$project->openai_prompt_id) {
                $prompt = $client->responses()->create([
                    'model'        => 'gpt-5', // или 'gpt-5.1' если уже доступна
                    'input'        => 'Инициализация системного промпта',
                    'instructions' => $this->aiDescription,
                    'tools'        => [
                        ['type' => 'web_search'], // если нужен поиск в вебе
                    ],
                ]);

                $project->openai_prompt_id = $prompt->id;
                $project->save();
            }

            // === 2. Создаём CONVERSATION (вечная память проекта) ===
            if (!$project->openai_conversation_id) {
                $conversation = $client->conversations()->create([]);
                $project->openai_conversation_id = $conversation->id;
                $project->save();
            }
            $project->update(['status' => "completed"]);
        } catch (Exception $e) {
            // Логируем ошибку, чтобы не потерять
            Log::error('Ошибка в ProjectAIJob для проекта ' . $this->projectId, [
                'exception' => $e->getMessage(),
                'trace'     => $e->getTraceAsString(),
            ]);
        }
    }
}
