<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantContextMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $tenantUuid = $request->header('X-Tenant-UUID');
        $tenantSlug = $request->header('X-Tenant-Slug');

        $tenant = null;

        if ($tenantUuid) {
            $tenant = Tenant::where('uuid', $tenantUuid)->first();
        } elseif ($tenantSlug) {
            $tenant = Tenant::where('slug', $tenantSlug)->first();
        }

        if ($tenant) {
            // Check if tenant is active
            if ($tenant->status !== 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant workspace is inactive or suspended'
                ], 403);
            }

            // Bind to container & share on request attributes
            app()->instance(Tenant::class, $tenant);
            $request->attributes->set('tenant', $tenant);
        }

        return $next($request);
    }
}
