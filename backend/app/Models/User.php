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
use Illuminate\Support\Str;

class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable, SoftDeletes;


    protected $dates = ['deleted_at'];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    public function tenants()
    {
        return $this->belongsToMany(Tenant::class, 'tenant_users')
            ->withPivot('role_id')
            ->withTimestamps();
    }

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
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
        'otp',
        'otp_expiry',
        'token_version'
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
        'two_factor_recovery_codes',
        'otp',
        'otp_expiry',
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

    public function userProfile()
    {
        return $this->hasOne(UserProfile::class);
    }

    public function tenantRole($tenantId)
    {
        $pivot = $this->tenants()->where('tenant_id', $tenantId)->first();
        if ($pivot && $pivot->pivot->role_id) {
            return \Spatie\Permission\Models\Role::find($pivot->pivot->role_id);
        }
        return null;
    }

    public function hasTenantRole($tenantId, string $roleName): bool
    {
        $role = $this->tenantRole($tenantId);
        return $role && $role->name === $roleName;
    }

    public function hasTenantPermission($tenantId, string $permissionName): bool
    {
        $role = $this->tenantRole($tenantId);
        return $role && $role->hasPermissionTo($permissionName);
    }
}
