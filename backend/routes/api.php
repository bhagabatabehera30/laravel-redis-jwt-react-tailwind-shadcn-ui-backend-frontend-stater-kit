<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\TenantController;
use App\Http\Controllers\API\TwoFactorController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\RoleController;
use App\Http\Controllers\API\NotificationController;
use App\Http\Middleware\TenantContextMiddleware;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('tfa/verify', [TwoFactorController::class, 'verify']);

        Route::middleware(['auth:api', 'token.version'])->group(function () {
            Route::get('me', [AuthController::class, 'me']);
            Route::put('profile', [AuthController::class, 'updateProfile']);

            // TFA Configuration endpoints
            Route::post('tfa/enable', [TwoFactorController::class, 'enable']);
            Route::post('tfa/confirm', [TwoFactorController::class, 'confirm']);
            Route::post('tfa/disable', [TwoFactorController::class, 'disable']);
        });
    });

    // Global Authenticated routes (no tenant context needed, just auth)
    Route::middleware(['auth:api'])->group(function () {
        // Roles & Permissions API
        Route::apiResource('roles', RoleController::class);
        Route::get('permissions', [RoleController::class, 'permissions']);

        // Notifications API
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::post('notifications/mark-as-read', [NotificationController::class, 'markAsRead']);
        Route::post('notifications/test', [NotificationController::class, 'test']);
    });

    // Tenants Management API (requires authentication & scopes using TenantContextMiddleware)
    Route::middleware(['auth:api', TenantContextMiddleware::class])->group(function () {
        Route::apiResource('tenants', TenantController::class);
        Route::apiResource('users', UserController::class);
    });
});
