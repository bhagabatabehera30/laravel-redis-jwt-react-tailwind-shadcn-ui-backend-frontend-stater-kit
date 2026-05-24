<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class TenantController extends Controller
{

    /**
     * Display a listing of tenants.
     */
    public function index(Request $request)
    {
        $user = auth('api')->user();

        if ($user->isAdminAccess()) {
            $tenants = Tenant::with('users')->get();
        } else {
            $tenants = $user->tenants;
        }

        return response()->json([
            'success' => true,
            'tenants' => $tenants
        ]);
    }

    /**
     * Store a newly created tenant.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:100|unique:tenants,slug',
            'domain' => 'nullable|string|max:255|unique:tenants,domain',
            'settings' => 'nullable|array',
        ]);

        $user = auth('api')->user();

        $tenant = Tenant::create([
            'uuid' => (string) Str::uuid(),
            'name' => $request->name,
            'slug' => Str::slug($request->slug),
            'domain' => $request->domain,
            'settings' => $request->settings ?? [],
            'status' => 1, // active by default
        ]);

        // Automatically assign creating user as the 'Owner' of the tenant
        $ownerRole = Role::firstOrCreate(['name' => 'Owner', 'guard_name' => 'api']);
        TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'role_id' => $ownerRole->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tenant workspace created successfully',
            'tenant' => $tenant->load('users')
        ], 201);
    }

    /**
     * Display the specified tenant.
     */
    public function show($uuid)
    {
        $tenant = Tenant::where('uuid', $uuid)->firstOrFail();
        $user = auth('api')->user();

        // Check if user has access to this tenant
        if (!$user->isAdminAccess() && !$user->tenants->contains($tenant->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access to this tenant workspace'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'tenant' => $tenant->load('users')
        ]);
    }

    /**
     * Update the specified tenant.
     */
    public function update(Request $request, $uuid)
    {
        $tenant = Tenant::where('uuid', $uuid)->firstOrFail();
        $user = auth('api')->user();

        // Authorize: Super Admin or user with Owner/Admin role in this tenant
        if (!$user->isAdminAccess()) {
            $hasPermission = $user->hasTenantPermission($tenant->id, 'api.tenant.update') 
                || $user->hasTenantRole($tenant->id, 'Owner') 
                || $user->hasTenantRole($tenant->id, 'Admin');

            if (!$hasPermission) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to update this tenant workspace'
                ], 403);
            }

            // Regular tenant admin can ONLY edit name of the tenant
            if ($request->hasAny(['slug', 'domain', 'settings', 'status'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Regular tenant admins can only view or edit the tenant name.'
                ], 403);
            }
        }

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'sometimes|required|string|max:100|unique:tenants,slug,' . $tenant->id,
            'domain' => 'nullable|string|max:255|unique:tenants,domain,' . $tenant->id,
            'settings' => 'nullable|array',
            'status' => 'sometimes|required|integer'
        ]);

        $tenant->update($request->only('name', 'slug', 'domain', 'settings', 'status'));

        return response()->json([
            'success' => true,
            'message' => 'Tenant workspace updated successfully',
            'tenant' => $tenant
        ]);
    }

    /**
     * Remove the specified tenant.
     */
    public function destroy($uuid)
    {
        $tenant = Tenant::where('uuid', $uuid)->firstOrFail();
        $user = auth('api')->user();

        // Authorize: Super Admin or Owner role in this tenant
        if (!$user->isAdminAccess()) {
            $hasPermission = $user->hasTenantPermission($tenant->id, 'api.tenant.delete') 
                || $user->hasTenantRole($tenant->id, 'Owner');

            if (!$hasPermission) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to delete this tenant workspace'
                ], 403);
            }
        }

        $tenant->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tenant workspace deleted successfully'
        ]);
    }
}
