<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class TenantUser extends Pivot
{
    protected $table = 'tenant_users';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'role_id',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
