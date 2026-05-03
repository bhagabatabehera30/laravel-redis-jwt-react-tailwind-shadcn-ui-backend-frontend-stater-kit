<?php

namespace App\Services;

use App\Contracts\AuthServiceInterface;

class AuthService implements AuthServiceInterface
{
    protected function guard()
    {
        return auth('api');
    }

    public function attempt(array $credentials): ?string
    {
        return $this->guard()->attempt($credentials);
    }

    public function user()
    {
        return $this->guard()->user();
    }

    public function login($user): string
    {
        return $this->guard()->login($user);
    }

    public function logout(): void
    {
        $this->guard()->logout();
    }

    public function ttl(): int
    {
        return $this->guard()->factory()->getTTL() * 60;
    }

    public function refresh(string $refreshToken): array
    {
        // 👉 Move your refresh logic here (DB + rotation)
        return [];
    }
}