<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Image extends Model
{
    protected $guarded = [];

    public function locations(): HasMany
    {
        return $this->hasMany(ImageLocation::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
