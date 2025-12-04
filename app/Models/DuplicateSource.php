<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DuplicateSource extends Model
{
    protected $fillable = [
        'domain',
        'url',
        'is_paid',
        'image_duplicates_id',
    ];

    protected $casts = [
        'is_paid' => 'boolean',
    ];


    // ← ЭТО ОБЯЗАТЕЛЬНО!
    public function duplicate()
    {
        return $this->belongsTo(ImageDuplicate::class);
    }
}
