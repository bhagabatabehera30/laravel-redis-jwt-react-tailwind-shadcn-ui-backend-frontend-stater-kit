<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Contracts\Auth\Access\Gate;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles,  HasFactory, Notifiable,  SoftDeletes;


    protected $dates = ['deleted_at'];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'mobile_number',
        'status',
        'author_bio',
        'user_pic',
        'facebook_link',
        'youtube_link',
        'linkedin_link',
        'instagram_link',
        'twitter_link'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret', 
        'two_factor_recovery_codes'
    ];


    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // Return JWT identifier
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    // Return custom claims
    public function getJWTCustomClaims()
    {
        return [
            'v' => $this->token_version,
        ];
    }

    public function isAdminAccess()
    {
        return $this->hasRole('Super Admin');
    }
    public function can($abilities, $arguments = [])
    {
        if ($this->isAdminAccess()) {
            return true;
        } else {
            return app(abstract: Gate::class)->forUser($this)->check($abilities, $arguments);
        }
    }
    public function canAny($abilities, $arguments = [])
    {
        if ($this->isAdminAccess()) {
            return true;
        } else {
            return app(Gate::class)->forUser($this)->any($abilities, $arguments);
        }
    }


    protected function permissionsArr()
    {
        return config('permissions');
    }
}
