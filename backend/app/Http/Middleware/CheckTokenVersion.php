<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CheckTokenVersion
{
    public function handle(Request $request, Closure $next): Response
    {
        Log::warning('CheckTokenVersion: Unauthenticated request', ['ip' => $request->ip()]);
        /** @var \Tymon\JWTAuth\JWTGuard $guard */
        $guard = auth('api');
        $user = $guard->user();
        if (!$user) {
            Log::warning('CheckTokenVersion: Unauthenticated request', ['ip' => $request->ip()]);
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        $payload = $guard->payload();
        if (!$payload) {
            Log::warning('CheckTokenVersion: Invalid token payload', ['user_id' => $user->id]);
            return response()->json([
                'success' => false,
                'message' => 'Invalid token',
            ], 401);
        }

        $tokenVersion = $payload->get('v');
        if ($tokenVersion === null) {
            Log::warning('CheckTokenVersion: Missing version in token', ['user_id' => $user->id]);
            return response()->json([
                'success' => false,
                'message' => 'Invalid token',
            ], 401);
        }

        $jti = $payload->get('jti');
        if (!$jti) {
            Log::warning('CheckTokenVersion: Missing jti in token', ['user_id' => $user->id]);
            return response()->json([
                'success' => false,
                'message' => 'Invalid token',
            ], 401);
        }

        if (Cache::has("revoked_jti:{$jti}")) {
            Log::info('CheckTokenVersion: Revoked token jti', ['user_id' => $user->id, 'jti' => $jti]);
            return response()->json([
                'success' => false,
                'message' => 'Token revoked',
            ], 401);
        }

        $cacheKey = "user:{$user->id}:token_version";
        $cachedVersion = Cache::get($cacheKey);

        // Fallback to DB if cache missing
        if ($cachedVersion === null) {
            $cachedVersion = $user->token_version;
            Cache::put($cacheKey, $cachedVersion, now()->addDays(config('auth.refresh_ttl_days', 7)));
        }

        if ((int) $tokenVersion !== (int) $cachedVersion) {
            Log::info('CheckTokenVersion: Token version mismatch, revoking', ['user_id' => $user->id]);
            return response()->json([
                'success' => false,
                'message' => 'Token revoked',
            ], 401);
        }

        // Optional: Check expiration (if not handled by JWT package)
        if ($payload->get('exp') && $payload->get('exp') < time()) {
            Log::info('CheckTokenVersion: Token expired', ['user_id' => $user->id]);
            return response()->json([
                'success' => false,
                'message' => 'Token expired',
            ], 401);
        }

        return $next($request);
    }
}