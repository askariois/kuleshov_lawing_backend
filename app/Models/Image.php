<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Image extends Model
{
    protected $guarded = [];

    protected $fillable = [
        'name',
        'path',
        'mime_type',
        'size',
        'dimensions',
        'width',
        'height',
        'status',
        'project_id',
    ];
    protected $casts = [
        'dimensions' => 'array', // ← Автоматически → array в PHP
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function locations(): HasMany
    {
        return $this->hasMany(ImageLocation::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
