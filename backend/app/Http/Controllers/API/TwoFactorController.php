<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use App\Contracts\AuthServiceInterface;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorController extends Controller
{
    protected Google2FA $google2fa;

    public function __construct(
        protected AuthServiceInterface $auth
    ) {
        $this->google2fa = new Google2FA();
    }

    /**
     * Enable Two-Factor Authentication (TFA) - Stage 1: Generate Google Authenticator Secret & QR code
     */
    public function enable(Request $request)
    {
        $user = auth('api')->user();

        // Generate base32 Google Authenticator secret key
        $secret = $this->google2fa->generateSecretKey();

        // Generate standard OTP QR Code URL (compatible with Google Authenticator, Authy, etc.)
        $qrCodeUrl = $this->google2fa->getQRCodeUrl(
            config('app.name', 'SaaS ERP'),
            $user->email,
            $secret
        );

        // Temporarily store the unconfirmed secret
        $user->update([
            'two_factor_secret' => encrypt($secret),
        ]);

        // Generate current OTP for out-of-the-box API testing
        $currentOtp = $this->google2fa->getCurrentOtp($secret);

        return response()->json([
            'success' => true,
            'message' => 'Two-factor secret generated successfully. Scan the QR code or key, and verify the code to confirm.',
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
            'current_otp' => $currentOtp, // Expose for effortless API testing
        ]);
    }

    /**
     * Confirm TFA - Stage 2: Verify TOTP code and activate
     */
    public function confirm(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $user = auth('api')->user();

        if (empty($user->two_factor_secret)) {
            return response()->json([
                'success' => false,
                'message' => 'Two-factor secret not generated yet. Call enable endpoint first.',
            ], 400);
        }

        $secret = decrypt($user->two_factor_secret);
        $isValid = $this->google2fa->verifyKey($secret, $request->code);

        if (!$isValid) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid Google Authenticator verification code',
            ], 422);
        }

        // Generate backup recovery codes
        $recoveryCodes = [];
        for ($i = 0; $i < 8; $i++) {
            $recoveryCodes[] = Str::random(10) . '-' . Str::random(10);
        }

        $user->update([
            'two_factor_confirmed_at' => now(),
            'two_factor_recovery_codes' => encrypt(json_encode($recoveryCodes)),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Two-factor Google Authenticator activated successfully.',
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    /**
     * Disable TFA
     */
    public function disable(Request $request)
    {
        $user = auth('api')->user();

        $user->update([
            'two_factor_secret' => null,
            'two_factor_confirmed_at' => null,
            'two_factor_recovery_codes' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Two-factor authentication has been disabled successfully.',
        ]);
    }

    /**
     * Verify TOTP code during login challenge
     */
    public function verify(Request $request)
    {
        $request->validate([
            'tfa_token' => 'required|string',
            'code' => 'required|string',
        ]);

        $userId = Cache::get("tfa_challenge:{$request->tfa_token}");

        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired TFA challenge session token',
            ], 422);
        }

        $user = User::find($userId);

        if (!$user || empty($user->two_factor_secret)) {
            return response()->json([
                'success' => false,
                'message' => 'User not configured for Two-factor authentication',
            ], 400);
        }

        $secret = decrypt($user->two_factor_secret);
        $isValid = $this->google2fa->verifyKey($secret, $request->code);

        if (!$isValid) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired authentication OTP code',
            ], 422);
        }

        // Clear TFA challenge token session
        Cache::forget("tfa_challenge:{$request->tfa_token}");

        // Generate JWT Access and Refresh Tokens
        $accessToken = $this->auth->login($user);
        $refreshToken = Str::random(64);
        $this->storeRefreshToken($user->id, $refreshToken, $request);
        $this->cacheTokenVersion($user);

        return $this->respondWithToken($accessToken, $refreshToken);
    }

    // Helper functions
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
