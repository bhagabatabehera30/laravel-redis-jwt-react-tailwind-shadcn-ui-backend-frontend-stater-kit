<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use App\Contracts\AuthServiceInterface;


class AuthController extends Controller
{
    public function __construct(
        protected AuthServiceInterface $auth
    ) {}

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
        ]);
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'user' => $user
        ], 201);
    }

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
        $refreshToken = Str::random(64);
        $this->storeRefreshToken($user->id, $refreshToken, $request);
        $this->cacheTokenVersion($user);

        return $this->respondWithToken($accessToken, $refreshToken);
    }

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

    public function me()
    {
        $user = $this->auth->user();
        $user->load('userProfile');
        return response()->json([
            'success' => true,
            'user' => $user
        ], 200);
    }

    public function logout(Request $request)
    {
        $user = $this->auth->user();

        /** @var \Tymon\JWTAuth\JWTGuard $jwt */
        $jwt = auth('api');
        if ($payload = $jwt->payload()) {
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

        $user->increment('token_version');
        $this->cacheTokenVersion($user);
        $this->auth->logout();

        DB::table('refresh_tokens')
            ->where('user_id', $user->id)
            ->delete();

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
        return Cookie::forget('refresh_token');
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
