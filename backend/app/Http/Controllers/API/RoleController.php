<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

class RoleController extends Controller
{
    /**
     * Check if user is authorized to manage roles.
     */
    protected function checkRoleAccess()
    {
        $user = auth('api')->user();
        if ($user->isAdminAccess()) {
            return true;
        }

        // We check globally because roles might be global in this application setup
        return $user->can('api.role.view'); // or whatever custom logic if tenant-based
    }

    #[OA\Get(
        path: "/api/v1/roles",
        summary: "List all roles",
        tags: ["Roles & Permissions"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of roles retrieved",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(
                            property: "roles",
                            type: "array",
                            items: new OA\Items(type: "object")
                        )
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Unauthorized")
        ]
    )]
    public function index()
    {
        $user = auth('api')->user();
        if (!$user->isAdminAccess() && !$user->canAny(['api.role.view'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $roles = Role::with('permissions')->get();
        return response()->json([
            'success' => true,
            'roles' => $roles
        ]);
    }

    #[OA\Post(
        path: "/api/v1/roles",
        summary: "Create a new role",
        tags: ["Roles & Permissions"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["name"],
                properties: [
                    new OA\Property(property: "name", type: "string", example: "Manager"),
                    new OA\Property(
                        property: "permissions",
                        type: "array",
                        items: new OA\Items(type: "string")
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "Role created successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "message", type: "string"),
                        new OA\Property(property: "role", type: "object")
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Unauthorized"),
            new OA\Response(response: 422, description: "Validation error")
        ]
    )]
    public function store(Request $request)
    {
        $user = auth('api')->user();
        if (!$user->isAdminAccess() && !$user->canAny(['api.role.create'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|unique:roles,name',
            'permissions' => 'array',
        ]);

        $role = Role::create(['name' => $request->name, 'guard_name' => 'api']);
        
        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        return response()->json([
            'success' => true,
            'message' => 'Role created successfully',
            'role' => $role->load('permissions')
        ], 201);
    }

    #[OA\Get(
        path: "/api/v1/roles/{role}",
        summary: "Get specific role details",
        tags: ["Roles & Permissions"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "role", in: "path", required: true, description: "Role ID", schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Role details retrieved",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "role", type: "object")
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Unauthorized"),
            new OA\Response(response: 404, description: "Not found")
        ]
    )]
    public function show($id)
    {
        $user = auth('api')->user();
        if (!$user->isAdminAccess() && !$user->canAny(['api.role.view'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $role = Role::with('permissions')->findOrFail($id);
        return response()->json([
            'success' => true,
            'role' => $role
        ]);
    }

    #[OA\Put(
        path: "/api/v1/roles/{role}",
        summary: "Update specific role",
        tags: ["Roles & Permissions"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "role", in: "path", required: true, description: "Role ID", schema: new OA\Schema(type: "integer"))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["name"],
                properties: [
                    new OA\Property(property: "name", type: "string", example: "Manager"),
                    new OA\Property(
                        property: "permissions",
                        type: "array",
                        items: new OA\Items(type: "string")
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Role updated successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "message", type: "string"),
                        new OA\Property(property: "role", type: "object")
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Unauthorized"),
            new OA\Response(response: 404, description: "Not found")
        ]
    )]
    public function update(Request $request, $id)
    {
        $user = auth('api')->user();
        if (!$user->isAdminAccess() && !$user->canAny(['api.role.update'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $role = Role::findOrFail($id);
        
        // Prevent editing default system roles names (Super Admin, Owner, Admin, User) 
        // if they are considered protected, but permissions might be editable (except Super Admin)
        if ($role->name === 'Super Admin') {
            return response()->json(['success' => false, 'message' => 'Cannot modify Super Admin role'], 403);
        }

        $request->validate([
            'name' => 'required|string|unique:roles,name,' . $role->id,
            'permissions' => 'array',
        ]);

        $role->update(['name' => $request->name]);

        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        return response()->json([
            'success' => true,
            'message' => 'Role updated successfully',
            'role' => $role->load('permissions')
        ]);
    }

    #[OA\Delete(
        path: "/api/v1/roles/{role}",
        summary: "Delete specific role",
        tags: ["Roles & Permissions"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "role", in: "path", required: true, description: "Role ID", schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Role deleted successfully",
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
    public function destroy($id)
    {
        $user = auth('api')->user();
        if (!$user->isAdminAccess() && !$user->canAny(['api.role.delete'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $role = Role::findOrFail($id);

        $protectedRoles = ['Super Admin', 'Owner', 'Admin', 'User'];
        if (in_array($role->name, $protectedRoles)) {
            return response()->json(['success' => false, 'message' => 'Cannot delete system default roles'], 403);
        }

        $role->delete();

        return response()->json([
            'success' => true,
            'message' => 'Role deleted successfully'
        ]);
    }

    #[OA\Get(
        path: "/api/v1/permissions",
        summary: "List all available permissions",
        tags: ["Roles & Permissions"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of permissions retrieved",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(
                            property: "permissions",
                            type: "object"
                        )
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Unauthorized")
        ]
    )]
    public function permissions()
    {
        $user = auth('api')->user();
        if (!$user->isAdminAccess() && !$user->canAny(['api.permission.view'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        // Return structured config permissions and database permissions
        $permissionsConfig = config('permissions.api', []);
        
        // Or if we just want raw DB permissions:
        // $permissions = Permission::all();

        return response()->json([
            'success' => true,
            'permissions' => $permissionsConfig
        ]);
    }
}
