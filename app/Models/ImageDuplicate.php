<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


class ImageDuplicate extends Model
{
    protected $table = 'image_duplicates';

    protected $fillable = ['image_id', 'site_name', 'images_count', 'stock_images_count', 'checked_at'];
    protected $casts = ['site_name' => 'array', 'checked_at' => 'datetime'];
}
