<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\TenantController;
use App\Http\Controllers\API\TwoFactorController;
use App\Http\Middleware\TenantContextMiddleware;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::post('tfa/verify', [TwoFactorController::class, 'verify']);

        Route::middleware(['auth:api', 'token.version'])->group(function () {
            Route::get('me', [AuthController::class, 'me']);
            Route::post('logout', [AuthController::class, 'logout']);

            // TFA Configuration endpoints
            Route::post('tfa/enable', [TwoFactorController::class, 'enable']);
            Route::post('tfa/confirm', [TwoFactorController::class, 'confirm']);
            Route::post('tfa/disable', [TwoFactorController::class, 'disable']);
        });
    });

    // Tenants Management API (requires authentication & scopes using TenantContextMiddleware)
    Route::middleware(['auth:api', TenantContextMiddleware::class])->group(function () {
        Route::apiResource('tenants', TenantController::class);
    });
});
