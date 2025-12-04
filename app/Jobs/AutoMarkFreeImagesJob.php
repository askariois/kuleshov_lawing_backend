<?php

namespace App\Jobs;

use App\Models\Image;
use App\Models\ImageDuplicate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class AutoMarkFreeImagesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;


    public function __construct()
    {
        //
    }

    public function handle(): void
    {
        // 1. Находим все изображения, у которых проверка завершена и стоковых дубликатов нет
        $freeImageIds = ImageDuplicate::query()
            ->where(function ($query) {
                $query->where('stock_images_count', 0)
                    ->orWhereNull('stock_images_count');
            })
            ->whereHas('image', function ($q) {
                $q->where('status', 'process');
            })
            ->pluck('image_id')
            ->unique();

        if ($freeImageIds->isEmpty()) {
            Log::info('AutoMarkFreeImagesJob: нет изображений для перевода в free');
            return;
        }

        // 2. Обновляем статус одним запросом (очень эффективно)
        $updatedCount = Image::whereIn('id', $freeImageIds)
            ->where('status', 'process')
            ->update([
                'status' => 'free',
                'updated_at' => now(),
            ]);

        // Опционально: можно сбросить статус проверки
        // Image::whereIn('id', $freeImageIds)->update([
        //     'duplicate_check_status' => Image::DUPLICATE_STATUS_IDLE,
        // ]);

        Log::info("AutoMarkFreeImagesJob: переведено в free — {$updatedCount} изображений", [
            'image_ids' => $freeImageIds->toArray(),
        ]);
    }

    /**
     * Обработка провала джоба (например, таймаут)
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('AutoMarkFreeImagesJob упал', [
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }
}
