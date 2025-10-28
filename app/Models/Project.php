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
    ];

    protected $casts = [
        'last_scan' => 'datetime',
        'autoscan' => 'boolean',
    ];

    public function images()
    {
        return $this->hasMany(Image::class);
    }
}
