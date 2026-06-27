<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Spatie Roles & Permissions dynamically from config/permissions.php
        $permissionsConfig = config('permissions.api', []);
        $allPermissions = [];
        foreach ($permissionsConfig as $group => $perms) {
            foreach ($perms as $name => $description) {
                $allPermissions[] = $name;
                Permission::firstOrCreate(['name' => $name, 'guard_name' => 'api']);
            }
        }

        $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'api']);
        $ownerRole = Role::firstOrCreate(['name' => 'Owner', 'guard_name' => 'api']);
        $adminRole = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'api']);
        $userRole = Role::firstOrCreate(['name' => 'User', 'guard_name' => 'api']);

        // Super Admin & Owner roles have full tenant workspace management permissions globally
        $superAdminRole->syncPermissions($allPermissions);
        $ownerRole->syncPermissions($allPermissions);

        // Admin role has all permissions except dangerous tenant deletion and global super admin actions
        $adminPermissions = array_filter($allPermissions, function ($p) {
            return $p !== 'api.tenant.delete' && $p !== 'api.super_admin.access';
        });
        $adminRole->syncPermissions($adminPermissions);

        // User role has base viewing permissions
        $userPermissions = ['api.dashboard.view', 'api.tenant.view', 'api.user.view'];
        $userRole->syncPermissions($userPermissions);

        // 2. Create Default Tenant
        $tenant = Tenant::create([
            'name' => 'Default Tenant',
            'slug' => 'default',
            'domain' => 'default.localhost',
            'status' => 1,
        ]);

        // 3. Default Frontend Admin User (Active status = 1, Global Super Admin, no tenant linkage)
        $adminUser = User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'admin@test.com',
            'password' => 'Abc@123456',
            'status' => 1,
        ]);
        $adminUser->assignRole($superAdminRole);

        // 4. Secondary Test User (Active status = 1)
        $testUser = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'status' => 1,
        ]);

        // Link Test User to Default Tenant with User Role
        TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id' => $testUser->id,
            'role_id' => $userRole->id,
        ]);
    }
}
