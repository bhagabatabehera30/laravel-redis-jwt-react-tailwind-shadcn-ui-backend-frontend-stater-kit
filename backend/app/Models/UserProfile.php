<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserProfile extends Model
{
    use HasFactory, SoftDeletes;

    protected $dates = ['deleted_at'];
    
    protected $fillable = [
        'user_id',
        'author_bio',
        'gender',
        'profession',
        'user_pic',
        'facebook_link',
        'youtube_link',
        'linkedin_link',
        'instagram_link',
        'twitter_link'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
