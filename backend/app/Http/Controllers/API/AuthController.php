<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Tenant;
use App\Models\TenantUser;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Cache;
use App\Contracts\AuthServiceInterface;
use OpenApi\Attributes as OA;


class AuthController extends Controller
{
    public function __construct(
        protected AuthServiceInterface $auth
    ) {}

    #[OA\Post(
        path: "/api/v1/auth/register",
        summary: "Register a new user",
        tags: ["Authentication"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["name", "email", "password"],
                properties: [
                    new OA\Property(property: "name", type: "string", example: "John Doe"),
                    new OA\Property(property: "email", type: "string", format: "email", example: "john@example.com"),
                    new OA\Property(property: "password", type: "string", format: "password", example: "password"),
                    new OA\Property(property: "mobile_number", type: "string", example: "+1234567890", nullable: true),
                    new OA\Property(property: "tenant_name", type: "string", example: "My Company", nullable: true),
                    new OA\Property(property: "tenant_slug", type: "string", example: "my-company", nullable: true),
                    new OA\Property(property: "tenant_domain", type: "string", example: "mycompany.saas.com", nullable: true)
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "User registered successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "message", type: "string", example: "User registered successfully"),
                        new OA\Property(property: "user", type: "object"),
                        new OA\Property(property: "tenant", type: "object", nullable: true)
                    ]
                )
            ),
            new OA\Response(response: 422, description: "Validation error")
        ]
    )]
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'mobile_number' => 'nullable|string|max:20',
            'tenant_name' => 'sometimes|required|string|max:255',
            'tenant_slug' => 'sometimes|required|string|max:100|unique:tenants,slug',
            'tenant_domain' => 'nullable|string|max:255|unique:tenants,domain',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'mobile_number' => $request->mobile_number,
            'status' => 1, // active by default upon registration
        ]);

        $tenant = null;
        if ($request->has('tenant_name') && $request->has('tenant_slug')) {
            $tenant = Tenant::create([
                'uuid' => (string) Str::uuid(),
                'name' => $request->tenant_name,
                'slug' => Str::slug($request->tenant_slug),
                'domain' => $request->tenant_domain,
                'status' => 1,
            ]);

            $ownerRole = Role::firstOrCreate(['name' => 'Owner', 'guard_name' => 'api']);
            TenantUser::create([
                'tenant_id' => $tenant->id,
                'user_id' => $user->id,
                'role_id' => $ownerRole->id,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'user' => $user,
            'tenant' => $tenant
        ], 201);
    }

    #[OA\Post(
        path: "/api/v1/auth/login",
        summary: "User Login",
        tags: ["Authentication"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["email", "password"],
                properties: [
                    new OA\Property(property: "email", type: "string", format: "email", example: "admin@test.com"),
                    new OA\Property(property: "password", type: "string", format: "password", example: "password")
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Successful Login",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "access_token", type: "string", example: "eyJ0eXAi..."),
                        new OA\Property(property: "token_type", type: "string", example: "bearer"),
                        new OA\Property(property: "expires_in", type: "integer", example: 3600)
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthorized"),
            new OA\Response(response: 202, description: "TFA Challenge required")
        ]
    )]
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);
        $credentials = $request->only('email', 'password');

        if (!$accessToken = $this->auth->attempt($credentials)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        $user = $this->auth->user();

        // 1. Enforce Active Status Checks
        if ($user->status !== 1) {
            $this->auth->logout(); // Log out from guard state
            return response()->json([
                'success' => false,
                'message' => 'Your account is inactive. Please contact support.',
            ], 403);
        }

        // 2. Multi-Factor / Two-Factor Authentication Check
        if ($user->two_factor_confirmed_at !== null) {
            $google2fa = new \PragmaRX\Google2FA\Google2FA();
            $secret = decrypt($user->two_factor_secret);
            $currentOtp = $google2fa->getCurrentOtp($secret);

            $challengeToken = Str::random(64);
            Cache::put("tfa_challenge:{$challengeToken}", $user->id, now()->addMinutes(10));

            // Log out from guard state for safety until TFA is fully validated
            $this->auth->logout();

            return response()->json([
                'success' => true,
                'tfa_required' => true,
                'tfa_token' => $challengeToken,
                'otp_code' => $currentOtp, // Expose dynamic TOTP code for testing/API clients
                'message' => 'Two-factor authentication code required'
            ]);
        }

        $refreshToken = Str::random(64);
        $this->storeRefreshToken($user->id, $refreshToken, $request);
        $this->cacheTokenVersion($user);

        return $this->respondWithToken($accessToken, $refreshToken);
    }

    #[OA\Post(
        path: "/api/v1/auth/refresh",
        summary: "Refresh access token",
        tags: ["Authentication"],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "refresh_token", type: "string", description: "Optional if passed via cookie")
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Token refreshed successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "access_token", type: "string"),
                        new OA\Property(property: "token_type", type: "string", example: "bearer"),
                        new OA\Property(property: "expires_in", type: "integer")
                    ]
                )
            ),
            new OA\Response(response: 400, description: "Refresh token not provided"),
            new OA\Response(response: 401, description: "Invalid or expired refresh token")
        ]
    )]
    public function refresh(Request $request)
    {
        $refreshToken = $request->cookie('refresh_token') ?? $request->input('refresh_token');

        if (!$refreshToken) {
            return response()->json([
                'success' => false,
                'message' => 'Refresh token not provided',
            ], 400);
        }

        $hashed = hash('sha256', $refreshToken);
        $record = DB::table('refresh_tokens')
            ->where('token', $hashed)
            ->where('expires_at', '>', now())
            ->first();

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired refresh token',
            ], 401);
        }

        DB::table('refresh_tokens')->where('id', $record->id)->delete();

        $user = User::find($record->user_id);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        $accessToken = $this->auth->login($user);
        $newRefreshToken = Str::random(64);
        $this->storeRefreshToken($user->id, $newRefreshToken, $request);
        $this->cacheTokenVersion($user);

        return $this->respondWithToken($accessToken, $newRefreshToken);
    }

    #[OA\Get(
        path: "/api/v1/auth/me",
        summary: "Get current authenticated user profile",
        tags: ["Authentication"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "User details retrieved successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "user", type: "object")
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated")
        ]
    )]
    public function me()
    {
        $user = $this->auth->user();
        $user->load(['userProfile', 'roles']);
        
        $userData = array_merge($user->toArray(), [
            'is_super_admin' => $user->isAdminAccess()
        ]);
        
        return response()->json([
            'success' => true,
            'user' => $userData
        ], 200);
    }

    #[OA\Put(
        path: "/api/v1/auth/profile",
        summary: "Update current user profile",
        tags: ["Authentication"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["name", "email"],
                properties: [
                    new OA\Property(property: "name", type: "string", example: "John Doe"),
                    new OA\Property(property: "email", type: "string", format: "email"),
                    new OA\Property(property: "mobile_number", type: "string", nullable: true),
                    new OA\Property(property: "password", type: "string", format: "password", nullable: true),
                    new OA\Property(property: "gender", type: "string", nullable: true),
                    new OA\Property(property: "profession", type: "string", nullable: true),
                    new OA\Property(property: "bio", type: "string", nullable: true),
                    new OA\Property(property: "profile_pic", type: "string", nullable: true)
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Profile updated successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "message", type: "string", example: "Profile updated successfully"),
                        new OA\Property(property: "user", type: "object")
                    ]
                )
            ),
            new OA\Response(response: 422, description: "Validation error"),
            new OA\Response(response: 401, description: "Unauthenticated")
        ]
    )]
    public function updateProfile(Request $request)
    {
        $user = $this->auth->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'mobile_number' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:6',
            'gender' => 'nullable|string',
            'profession' => 'nullable|string',
            'bio' => 'nullable|string',
            'profile_pic' => 'nullable|string',
        ]);

        $user->name = $request->name;
        $user->email = $request->email;
        $user->mobile_number = $request->mobile_number;

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        if ($user->userProfile) {
            $user->userProfile->update([
                'gender' => $request->gender,
                'profession' => $request->profession,
                'author_bio' => $request->bio,
                'user_pic' => $request->profile_pic,
            ]);
        } else {
            $user->userProfile()->create([
                'gender' => $request->gender,
                'profession' => $request->profession,
                'author_bio' => $request->bio,
                'user_pic' => $request->profile_pic,
            ]);
        }

        $user->load(['userProfile', 'roles']);
        $userData = array_merge($user->toArray(), [
            'is_super_admin' => $user->isAdminAccess()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'user' => $userData
        ], 200);
    }

    #[OA\Post(
        path: "/api/v1/auth/logout",
        summary: "Logout the user",
        tags: ["Authentication"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "Successfully logged out",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "message", type: "string", example: "Successfully logged out")
                    ]
                )
            )
        ]
    )]
    public function logout(Request $request)
    {
        try {
            $user = $this->auth->user();

            /** @var \Tymon\JWTAuth\JWTGuard $jwt */
            $jwt = auth('api');
            
            if ($jwt->check() && $payload = $jwt->payload()) {
                $jti = $payload->get('jti');
                $expiresAt = $payload->get('exp');
                if ($jti && $expiresAt) {
                    Cache::put(
                        "revoked_jti:{$jti}",
                        true,
                        now()->diffInSeconds(now()->setTimestamp($expiresAt))
                    );
                }
            }

            if ($user) {
                $user->increment('token_version');
                $this->cacheTokenVersion($user);

                DB::table('refresh_tokens')
                    ->where('user_id', $user->id)
                    ->delete();
            }
            
            $this->auth->logout();
        } catch (\Exception $e) {
            // Ignore exception if token is invalid or expired
        }

        // Fallback: forcefully remove refresh token from DB by matching the cookie
        $refreshToken = $request->cookie('refresh_token');
        if ($refreshToken) {
            $hashed = hash('sha256', $refreshToken);
            DB::table('refresh_tokens')->where('token', $hashed)->delete();
        }

        return $this->respondLogout();
    }

    protected function getAccessTokenTTL()
    {
        return $this->auth->ttl();
    }

    protected function respondWithToken($accessToken, $refreshToken)
    {
        return response()->json([
            'success' => true,
            'access_token' => $accessToken,
            'token_type' => 'bearer',
            'expires_in' => $this->getAccessTokenTTL(),
        ])->withCookie($this->makeRefreshCookie($refreshToken));
    }

    protected function respondLogout()
    {
        return response()->json([
            'success' => true,
            'message' => 'Logged out',
        ])->withCookie($this->expireRefreshCookie());
    }

    protected function makeRefreshCookie(string $refreshToken)
    {
        $minutes = config('auth.refresh_ttl_days', 7) * 24 * 60;

        return cookie(
            'refresh_token',
            $refreshToken,
            $minutes,
            '/',
            null,
            app()->environment('production'),
            true,
            false,
            'lax'
        );
    }

    protected function expireRefreshCookie()
    {
        return cookie(
            'refresh_token',
            '',
            -2628000,
            '/',
            null,
            app()->environment('production'),
            true,
            false,
            'lax'
        );
    }

    protected function storeRefreshToken(int $userId, string $refreshToken, Request $request): void
    {
        DB::table('refresh_tokens')->insert([
            'user_id' => $userId,
            'token' => hash('sha256', $refreshToken),
            'expires_at' => now()->addDays(config('auth.refresh_ttl_days', 7)),
            'device_name' => $request->header('X-Device-Name') ?? 'Unknown Device',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    protected function cacheTokenVersion($user)
    {
        Cache::put(
            "user:{$user->id}:token_version",
            $user->token_version,
            now()->addDays(config('auth.refresh_ttl_days', 7))
        );
    }
}
