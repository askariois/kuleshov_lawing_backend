<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

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
        'dimensions' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function locations(): HasMany
    {
        return $this->hasMany(ImageLocation::class);
    }

    public function duplicate(): HasOne
    {
        return $this->hasOne(ImageDuplicate::class, 'image_id', 'id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
