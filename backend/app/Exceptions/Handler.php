<?php

namespace App\Exceptions;

use Throwable;
use Illuminate\Http\Request;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;

// JWT Exceptions
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;
use Tymon\JWTAuth\Exceptions\JWTException;

class Handler extends ExceptionHandler
{
    /**
     * Inputs that are never flashed for validation exceptions.
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register exception handling callbacks.
     */
    public function register(): void
    {
        //
    }

    /**
     * Handle unauthenticated users (IMPORTANT FIX).
     */
    protected function unauthenticated($request, AuthenticationException $exception)
    {
        return response()->json([
            'success' => false,
            'message' => 'Unauthenticated',
        ], 401);
    }

    /**
     * Render exceptions as JSON responses for API.
     */
    public function render($request, Throwable $exception)
    {
        // ✅ JWT: Token expired
        if ($exception instanceof TokenExpiredException) {
            return response()->json([
                'success' => false,
                'message' => 'Token expired',
            ], 401);
        }

        // ✅ JWT: Token invalid
        if ($exception instanceof TokenInvalidException) {
            return response()->json([
                'success' => false,
                'message' => 'Token invalid',
            ], 401);
        }

        // ✅ JWT: Token absent / general JWT error
        if ($exception instanceof JWTException) {
            return response()->json([
                'success' => false,
                'message' => 'Token not provided',
            ], 401);
        }

        // ✅ Validation errors
        if ($exception instanceof ValidationException) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $exception->errors(),
            ], 422);
        }

        // ✅ Model not found
        if ($exception instanceof ModelNotFoundException) {
            return response()->json([
                'success' => false,
                'message' => 'Resource not found',
            ], 404);
        }

        // ✅ HTTP exceptions (404, 403, etc.)
        if ($exception instanceof HttpExceptionInterface) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage() ?: 'HTTP error',
            ], $exception->getStatusCode());
        }

        // ✅ Fallback (server error)
        return response()->json([
            'success' => false,
            'message' => config('app.debug')
                ? $exception->getMessage()
                : 'Server Error',
        ], 500);
    }
}