<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'url',
        'last_scan',
        'images_count',
        'processed_images',
        'not_processed_images',
        'notification',
        'format_images',
        'autoscan',
        'time_autoscan',
        'parent_id',
        'total_pages',
        'processed_pages',
        'scan_status',
        'scan_started_at',
        'scan_finished_at',
        'scan_error',
        'ai_name',
        'ai_description',
        'openai_prompt_id',
        'openai_conversation_id',
        'preferred_style',
        'preferred_size',
        'preferred_quality',
        'generated_count',
        'status',
    ];

    protected $casts = [
        'last_scan' => 'datetime',
        'autoscan' => 'boolean',
    ];

    public function images()
    {
        return $this->hasMany(Image::class);
    }

    public function pages()
    {
        return $this->hasMany(CrawledLogs::class);
    }

    public function subdomains()
    {
        return $this->hasMany(Project::class, 'parent_id');
    }
}
