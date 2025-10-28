<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ImageLocation extends Model
{
    protected $guarded = [];

    public function image()
    {
        return $this->belongsTo(Image::class);
    }
}
