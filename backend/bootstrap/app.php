<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;
use Tymon\JWTAuth\Exceptions\JWTException;
use App\Http\Middleware\ForceJsonResponse;
use App\Http\Middleware\CheckTokenVersion;


return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        channels: __DIR__ . '/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo(null);
        $middleware->use([
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
        $middleware->appendToGroup('api', [
            ForceJsonResponse::class
        ]);
        $middleware->alias([
            'token.version' => CheckTokenVersion::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // 🔐 Unauthenticated (FIX for "Route [login] not defined")
        $exceptions->render(function (AuthenticationException $e, $request) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        });

        // 🔑 JWT: expired
        $exceptions->render(function (TokenExpiredException $e, $request) {
            return response()->json([
                'success' => false,
                'message' => 'Token expired',
            ], 401);
        });

        // 🔑 JWT: invalid
        $exceptions->render(function (TokenInvalidException $e, $request) {
            return response()->json([
                'success' => false,
                'message' => 'Token invalid',
            ], 401);
        });

        // 🔑 JWT: missing
        $exceptions->render(function (JWTException $e, $request) {
            return response()->json([
                'success' => false,
                'message' => 'Token not provided',
            ], 401);
        });

        // ⚠️ Validation
        $exceptions->render(function (ValidationException $e, $request) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        });

        // 📦 Model not found
        $exceptions->render(function (ModelNotFoundException $e, $request) {
            return response()->json([
                'success' => false,
                'message' => 'Resource not found',
            ], 404);
        });

        // 🌐 HTTP errors (404, 403, etc.)
        $exceptions->render(function (HttpExceptionInterface $e, $request) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'HTTP error',
            ], $e->getStatusCode());
        });
    })->create();
