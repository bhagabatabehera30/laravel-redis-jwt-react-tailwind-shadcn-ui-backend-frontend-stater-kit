<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Tenant extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'uuid',
        'name',
        'slug',
        'domain',
        'status',
        'settings',
        'trial_ends_at',
    ];

    protected $casts = [
        'settings' => 'array',
        'trial_ends_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'tenant_users')
            ->withPivot('role_id')
            ->withTimestamps();
    }
}