<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Space extends Model
{
    protected $guarded = [];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function photo()
    {
        return $this->hasMany(SpacePhoto::class, 'space_id', 'id');
    }
}
