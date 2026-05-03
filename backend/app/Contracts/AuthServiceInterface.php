<?php

namespace App\Contracts;

interface AuthServiceInterface
{
    public function attempt(array $credentials): ?string;

    public function user();

    public function login($user): string;

    public function logout(): void;

    public function refresh(string $refreshToken): array;

    public function ttl(): int;
}