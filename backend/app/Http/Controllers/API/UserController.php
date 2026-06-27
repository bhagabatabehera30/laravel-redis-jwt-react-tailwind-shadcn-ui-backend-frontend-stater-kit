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
use OpenApi\Attributes as OA;

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

    #[OA\Get(
        path: "/api/v1/users",
        summary: "List all users in the current active tenant",
        tags: ["Users"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "X-Tenant-Id", in: "header", required: false, description: "Optional UUID of the tenant context", schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "page", in: "query", required: false, description: "Page number", schema: new OA\Schema(type: "integer", default: 1)),
            new OA\Parameter(name: "per_page", in: "query", required: false, description: "Items per page", schema: new OA\Schema(type: "integer", default: 10)),
            new OA\Parameter(name: "search", in: "query", required: false, description: "Search by name or email", schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "status", in: "query", required: false, description: "Filter by status (all, 1, 0)", schema: new OA\Schema(type: "string", default: "all"))
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of users retrieved",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(
                            property: "users",
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
        $tenant = $this->getTenant($request);
        $authUser = auth('api')->user();

        if (!$tenant) {
            if (!$authUser->isAdminAccess()) {
                return response()->json(['success' => false, 'message' => 'Tenant context required'], 400);
            }
            // Global access for Super Admin
            $usersQuery = User::with('userProfile', 'roles');
        } else {
            if (!$this->checkTenantAccess($authUser, $tenant, 'api.user.view')) {
                return response()->json(['success' => false, 'message' => 'Unauthorized to view users in this tenant'], 403);
            }
            $usersQuery = $tenant->users()->with('userProfile');
        }

        // Search Filter
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $usersQuery->where(function($q) use ($search) {
                $q->where('users.name', 'like', "%{$search}%")
                  ->orWhere('users.email', 'like', "%{$search}%");
            });
        }

        // Status Filter
        if ($request->has('status') && $request->status !== 'all') {
            $usersQuery->where('users.status', $request->status);
        }

        $perPage = $request->input('per_page', 10);
        $paginatedUsers = $usersQuery->paginate($perPage);

        // Map roles
        $paginatedUsers->getCollection()->transform(function ($u) use ($tenant) {
            if (!$tenant) {
                $u->role = $u->roles->first()->name ?? 'User';
            } else {
                $u->role = $u->tenantRole($tenant->id)->name ?? 'User';
            }
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
            'users' => $paginatedUsers
        ]);
    }

    #[OA\Post(
        path: "/api/v1/users",
        summary: "Add a new user to the tenant",
        tags: ["Users"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "X-Tenant-Id", in: "header", required: false, description: "Optional UUID of the tenant context", schema: new OA\Schema(type: "string"))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["first_name", "last_name", "email", "mobile", "password", "status", "role"],
                properties: [
                    new OA\Property(property: "first_name", type: "string", example: "John"),
                    new OA\Property(property: "last_name", type: "string", example: "Doe"),
                    new OA\Property(property: "email", type: "string", format: "email"),
                    new OA\Property(property: "mobile", type: "string"),
                    new OA\Property(property: "password", type: "string", format: "password"),
                    new OA\Property(property: "status", type: "integer", example: 1),
                    new OA\Property(property: "role", type: "string", example: "Admin"),
                    new OA\Property(property: "gender", type: "string", nullable: true),
                    new OA\Property(property: "profession", type: "string", nullable: true),
                    new OA\Property(property: "bio", type: "string", nullable: true),
                    new OA\Property(property: "profile_pic", type: "string", nullable: true)
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "User created successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "message", type: "string"),
                        new OA\Property(property: "user", type: "object")
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Unauthorized"),
            new OA\Response(response: 422, description: "Validation error")
        ]
    )]
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

    #[OA\Get(
        path: "/api/v1/users/{user}",
        summary: "Get specific user details",
        tags: ["Users"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "user", in: "path", required: true, description: "User ID", schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "X-Tenant-Id", in: "header", required: false, description: "Optional UUID of the tenant context", schema: new OA\Schema(type: "string"))
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "User details retrieved",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "user", type: "object")
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Unauthorized"),
            new OA\Response(response: 404, description: "Not found")
        ]
    )]
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

    #[OA\Put(
        path: "/api/v1/users/{user}",
        summary: "Update user details",
        tags: ["Users"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "user", in: "path", required: true, description: "User ID", schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "X-Tenant-Id", in: "header", required: false, description: "Optional UUID of the tenant context", schema: new OA\Schema(type: "string"))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "first_name", type: "string"),
                    new OA\Property(property: "last_name", type: "string"),
                    new OA\Property(property: "email", type: "string", format: "email"),
                    new OA\Property(property: "mobile", type: "string"),
                    new OA\Property(property: "status", type: "integer"),
                    new OA\Property(property: "role", type: "string"),
                    new OA\Property(property: "password", type: "string", format: "password", nullable: true)
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "User updated successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "message", type: "string"),
                        new OA\Property(property: "user", type: "object")
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Unauthorized"),
            new OA\Response(response: 404, description: "Not found")
        ]
    )]
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

    #[OA\Delete(
        path: "/api/v1/users/{user}",
        summary: "Remove user from tenant",
        tags: ["Users"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "user", in: "path", required: true, description: "User ID", schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "X-Tenant-Id", in: "header", required: false, description: "Optional UUID of the tenant context", schema: new OA\Schema(type: "string"))
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "User removed successfully",
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
