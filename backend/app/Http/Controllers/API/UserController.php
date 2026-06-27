<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\UserProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Str;

class UserController extends Controller
{
    protected function getTenant(Request $request): ?Tenant
    {
        return $request->attributes->get('tenant');
    }

    protected function checkTenantAccess(User $user, Tenant $tenant, string $permission): bool
    {
        if ($user->isAdminAccess()) {
            return true;
        }

        $hasPermission = $user->hasTenantPermission($tenant->id, $permission) 
            || $user->hasTenantRole($tenant->id, 'Owner') 
            || $user->hasTenantRole($tenant->id, 'Admin');

        return $hasPermission;
    }

    public function index(Request $request)
    {
        $tenant = $this->getTenant($request);
        $authUser = auth('api')->user();

        if (!$tenant) {
            if (!$authUser->isAdminAccess()) {
                return response()->json(['success' => false, 'message' => 'Tenant context required'], 400);
            }
            // Global access for Super Admin
            $users = User::with('userProfile', 'roles')->get()->map(function ($u) {
                $u->role = $u->roles->first()->name ?? 'User';
                return $u;
            });
        } else {
            if (!$this->checkTenantAccess($authUser, $tenant, 'api.user.view')) {
                return response()->json(['success' => false, 'message' => 'Unauthorized to view users in this tenant'], 403);
            }
            $users = $tenant->users()->with('userProfile')->get()->map(function ($u) use ($tenant) {
                $u->role = $u->tenantRole($tenant->id)->name ?? 'User';
                return $u;
            });
        }

        // Format to match frontend structure for easy integration
        $formattedUsers = $users->map(function ($u) {
            return [
                'id' => $u->id,
                'first_name' => $u->userProfile->first_name ?? $u->name,
                'last_name' => $u->userProfile->last_name ?? '',
                'email' => $u->email,
                'mobile' => $u->mobile_number,
                'status' => (string) $u->status,
                'profile_pic' => $u->userProfile->profile_pic ?? '',
                'gender' => $u->userProfile->gender ?? 'male',
                'profession' => $u->userProfile->profession ?? '',
                'bio' => $u->userProfile->bio ?? '',
                'role' => $u->role,
            ];
        });

        return response()->json([
            'success' => true,
            'users' => $formattedUsers
        ]);
    }

    public function store(Request $request)
    {
        $tenant = $this->getTenant($request);
        $authUser = auth('api')->user();

        if (!$tenant) {
            if (!$authUser->isAdminAccess()) {
                return response()->json(['success' => false, 'message' => 'Tenant context required'], 400);
            }
        } else {
            if (!$this->checkTenantAccess($authUser, $tenant, 'api.user.create')) {
                return response()->json(['success' => false, 'message' => 'Unauthorized to add users to this tenant'], 403);
            }
        }

        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'mobile' => 'required|string|max:20',
            'password' => 'required|string|min:6',
            'status' => 'required|in:0,1',
            'role' => 'required|string|exists:roles,name',
            'gender' => 'nullable|string',
            'profession' => 'nullable|string',
            'bio' => 'nullable|string',
            'profile_pic' => 'nullable|string',
        ]);

        $user = User::create([
            'name' => $request->first_name . ' ' . $request->last_name,
            'email' => $request->email,
            'mobile_number' => $request->mobile,
            'password' => Hash::make($request->password),
            'status' => (int) $request->status,
            'uuid' => (string) Str::uuid(),
        ]);

        UserProfile::create([
            'user_id' => $user->id,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'gender' => $request->gender,
            'profession' => $request->profession,
            'bio' => $request->bio,
            'profile_pic' => $request->profile_pic,
        ]);

        $role = Role::where('name', $request->role)->where('guard_name', 'api')->first();
        
        if ($tenant) {
            TenantUser::create([
                'tenant_id' => $tenant->id,
                'user_id' => $user->id,
                'role_id' => $role->id,
            ]);
        } else {
            // Assign role globally if created outside a tenant
            $user->assignRole($role);
        }

        return response()->json([
            'success' => true,
            'message' => $tenant ? 'User created and added to tenant successfully' : 'Global user created successfully',
            'user' => $user
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $tenant = $this->getTenant($request);
        $authUser = auth('api')->user();

        if (!$tenant) {
            if (!$authUser->isAdminAccess()) {
                return response()->json(['success' => false, 'message' => 'Tenant context required'], 400);
            }
            $user = User::with('userProfile', 'roles')->where('id', $id)->first();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'User not found'], 404);
            }
            $user->role = $user->roles->first()->name ?? 'User';
        } else {
            if (!$this->checkTenantAccess($authUser, $tenant, 'api.user.view')) {
                return response()->json(['success' => false, 'message' => 'Unauthorized to view users in this tenant'], 403);
            }
            $user = $tenant->users()->with('userProfile')->where('users.id', $id)->first();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'User not found in this tenant'], 404);
            }
            $user->role = $user->tenantRole($tenant->id)->name ?? 'User';
        }

        $formattedUser = [
            'id' => $user->id,
            'first_name' => $user->userProfile->first_name ?? $user->name,
            'last_name' => $user->userProfile->last_name ?? '',
            'email' => $user->email,
            'mobile' => $user->mobile_number,
            'status' => (string) $user->status,
            'profile_pic' => $user->userProfile->profile_pic ?? '',
            'gender' => $user->userProfile->gender ?? 'male',
            'profession' => $user->userProfile->profession ?? '',
            'bio' => $user->userProfile->bio ?? '',
            'role' => $user->role,
        ];

        return response()->json([
            'success' => true,
            'user' => $formattedUser
        ]);
    }

    public function update(Request $request, $id)
    {
        $tenant = $this->getTenant($request);
        $authUser = auth('api')->user();

        if (!$tenant) {
            if (!$authUser->isAdminAccess()) {
                return response()->json(['success' => false, 'message' => 'Tenant context required'], 400);
            }
            $user = User::where('id', $id)->first();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'User not found'], 404);
            }
        } else {
            if (!$this->checkTenantAccess($authUser, $tenant, 'api.user.update')) {
                return response()->json(['success' => false, 'message' => 'Unauthorized to update users in this tenant'], 403);
            }
            $user = $tenant->users()->where('users.id', $id)->first();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'User not found in this tenant'], 404);
            }
        }

        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'mobile' => 'required|string|max:20',
            'status' => 'required|in:0,1',
            'role' => 'required|string|exists:roles,name',
            'password' => 'nullable|string|min:6',
            'gender' => 'nullable|string',
            'profession' => 'nullable|string',
            'bio' => 'nullable|string',
        ]);

        $updateData = [
            'name' => $request->first_name . ' ' . $request->last_name,
            'email' => $request->email,
            'mobile_number' => $request->mobile,
            'status' => (int) $request->status,
        ];

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        UserProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'gender' => $request->gender,
                'profession' => $request->profession,
                'bio' => $request->bio,
            ]
        );

        if ($request->filled('profile_pic') && strpos($request->profile_pic, 'data:image') === 0) {
            UserProfile::where('user_id', $user->id)->update(['profile_pic' => $request->profile_pic]);
        }

        $role = Role::where('name', $request->role)->where('guard_name', 'api')->first();
        
        if ($tenant) {
            TenantUser::where('tenant_id', $tenant->id)
                ->where('user_id', $user->id)
                ->update(['role_id' => $role->id]);
        } else {
            $user->syncRoles([$role]);
        }

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'user' => $user
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $tenant = $this->getTenant($request);
        $authUser = auth('api')->user();

        if (!$tenant) {
            if (!$authUser->isAdminAccess()) {
                return response()->json(['success' => false, 'message' => 'Tenant context required'], 400);
            }
            $user = User::where('id', $id)->first();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'User not found'], 404);
            }
            
            // Global Delete
            $user->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'User deleted globally successfully'
            ]);
        } else {
            if (!$this->checkTenantAccess($authUser, $tenant, 'api.user.delete')) {
                return response()->json(['success' => false, 'message' => 'Unauthorized to remove users from this tenant'], 403);
            }
            $user = $tenant->users()->where('users.id', $id)->first();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'User not found in this tenant'], 404);
            }

            // Only remove the user from the tenant (don't delete the global user account)
            TenantUser::where('tenant_id', $tenant->id)->where('user_id', $user->id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'User removed from tenant successfully'
            ]);
        }
    }
}
