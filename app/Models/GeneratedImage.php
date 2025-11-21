<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GeneratedImage extends Model
{
    protected $fillable = [
        'project_id',
        'image_id',
        'url',
        'openai_url',
        'prompt',
        'model',
        'size',
        'n',
        'quality',
        'style',
        'response_data',
        'width',
        'height',
        'format',
        'file_size',
        'user_id',
        'status',
        'generated_at',
        'downloaded_at',
    ];
}
