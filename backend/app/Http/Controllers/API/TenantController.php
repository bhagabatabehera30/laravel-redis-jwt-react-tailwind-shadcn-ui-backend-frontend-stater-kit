<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use OpenApi\Attributes as OA;

class TenantController extends Controller
{

    /**
     * Display a listing of tenants.
     */
    #[OA\Get(
        path: "/api/v1/tenants",
        summary: "List all tenants",
        tags: ["Tenants"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "page", in: "query", required: false, description: "Page number", schema: new OA\Schema(type: "integer", default: 1)),
            new OA\Parameter(name: "per_page", in: "query", required: false, description: "Items per page", schema: new OA\Schema(type: "integer", default: 10))
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of tenants retrieved",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(
                            property: "tenants",
                            type: "object",
                            properties: [
                                new OA\Property(property: "current_page", type: "integer", example: 1),
                                new OA\Property(
                                    property: "data",
                                    type: "array",
                                    items: new OA\Items(type: "object")
                                ),
                                new OA\Property(property: "last_page", type: "integer", example: 10),
                                new OA\Property(property: "per_page", type: "integer", example: 10),
                                new OA\Property(property: "total", type: "integer", example: 100),
                            ]
                        )
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Unauthorized")
        ]
    )]
    public function index(Request $request)
    {
        $user = auth('api')->user();

        if (!$user->isAdminAccess() && !$user->canAny(['api.tenant.view'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized to view tenants'], 403);
        }

        $perPage = $request->input('per_page', 10);

        if ($user->isAdminAccess()) {
            $tenants = Tenant::with('users')->paginate($perPage);
        } else {
            $tenants = $user->tenants()->paginate($perPage);
        }

        return response()->json([
            'success' => true,
            'tenants' => $tenants
        ]);
    }

    /**
     * Store a newly created tenant.
     */
    #[OA\Post(
        path: "/api/v1/tenants",
        summary: "Create a new tenant",
        tags: ["Tenants"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["name", "slug", "owner_first_name", "owner_last_name", "owner_email", "owner_password"],
                properties: [
                    new OA\Property(property: "name", type: "string", example: "Acme Corp"),
                    new OA\Property(property: "slug", type: "string", example: "acme-corp"),
                    new OA\Property(property: "domain", type: "string", example: "acme.saas.com", nullable: true),
                    new OA\Property(property: "owner_first_name", type: "string", example: "John"),
                    new OA\Property(property: "owner_last_name", type: "string", example: "Doe"),
                    new OA\Property(property: "owner_email", type: "string", format: "email"),
                    new OA\Property(property: "owner_password", type: "string", format: "password")
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "Tenant created successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "message", type: "string"),
                        new OA\Property(property: "tenant", type: "object")
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Unauthorized"),
            new OA\Response(response: 422, description: "Validation error")
        ]
    )]
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:100|unique:tenants,slug',
            'domain' => 'nullable|string|max:255|unique:tenants,domain',
            'settings' => 'nullable|array',
            'owner_first_name' => 'required|string|max:255',
            'owner_last_name' => 'required|string|max:255',
            'owner_email' => 'required|email|unique:users,email',
            'owner_password' => 'required|string|min:6',
        ]);

        $user = auth('api')->user();

        if (!$user->isAdminAccess() && !$user->canAny(['api.tenant.create'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized to create tenants'], 403);
        }

        $tenant = Tenant::create([
            'uuid' => (string) Str::uuid(),
            'name' => $request->name,
            'slug' => Str::slug($request->slug),
            'domain' => $request->domain,
            'settings' => $request->settings ?? [],
            'status' => 1, // active by default
        ]);

        // Create the primary owner user account
        $ownerUser = \App\Models\User::create([
            'name' => $request->owner_first_name . ' ' . $request->owner_last_name,
            'email' => $request->owner_email,
            'password' => \Illuminate\Support\Facades\Hash::make($request->owner_password),
            'status' => 1,
            'uuid' => (string) Str::uuid(),
        ]);

        \App\Models\UserProfile::create([
            'user_id' => $ownerUser->id,
            'first_name' => $request->owner_first_name,
            'last_name' => $request->owner_last_name,
        ]);

        // Automatically assign the newly created user as the 'Owner' of the tenant
        $ownerRole = Role::firstOrCreate(['name' => 'Owner', 'guard_name' => 'api']);
        TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id' => $ownerUser->id,
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
    #[OA\Get(
        path: "/api/v1/tenants/{tenant}",
        summary: "Get specific tenant details",
        tags: ["Tenants"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "tenant", in: "path", required: true, description: "Tenant UUID", schema: new OA\Schema(type: "string"))
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Tenant details retrieved",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "tenant", type: "object")
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Unauthorized"),
            new OA\Response(response: 404, description: "Not found")
        ]
    )]
    public function show($uuid)
    {
        $tenant = Tenant::where('uuid', $uuid)->firstOrFail();
        $user = auth('api')->user();

        // Check if user has access to this tenant
        if (!$user->isAdminAccess()) {
            if (!$user->tenants->contains($tenant->id) && !$user->canAny(['api.tenant.view'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this tenant workspace'
                ], 403);
            }
        }

        return response()->json([
            'success' => true,
            'tenant' => $tenant->load('users')
        ]);
    }

    /**
     * Update the specified tenant.
     */
    #[OA\Put(
        path: "/api/v1/tenants/{tenant}",
        summary: "Update specific tenant",
        tags: ["Tenants"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "tenant", in: "path", required: true, description: "Tenant UUID", schema: new OA\Schema(type: "string"))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "name", type: "string"),
                    new OA\Property(property: "slug", type: "string"),
                    new OA\Property(property: "domain", type: "string", nullable: true),
                    new OA\Property(property: "status", type: "integer")
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Tenant updated successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "message", type: "string"),
                        new OA\Property(property: "tenant", type: "object")
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Unauthorized"),
            new OA\Response(response: 404, description: "Not found")
        ]
    )]
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
    #[OA\Delete(
        path: "/api/v1/tenants/{tenant}",
        summary: "Delete specific tenant",
        tags: ["Tenants"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "tenant", in: "path", required: true, description: "Tenant UUID", schema: new OA\Schema(type: "string"))
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Tenant deleted successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "message", type: "string")
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Unauthorized"),
            new OA\Response(response: 404, description: "Not found")
        ]
    )]
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
