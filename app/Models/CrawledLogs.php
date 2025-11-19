<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CrawledLogs extends Model
{
    protected $fillable = [
        'project_id',
        'url',
        'images_count',
        'status',
        'error',
        'crawled_at',
    ];

    protected $casts = [
        'crawled_at' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
