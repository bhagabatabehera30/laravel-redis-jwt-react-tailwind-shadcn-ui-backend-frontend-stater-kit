<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;

#[OA\Info(version: "1.0.0", title: "SaaS ERP API", description: "API Documentation for the Multi-tenant SaaS ERP Application")]
#[OA\Server(url: L5_SWAGGER_CONST_HOST, description: "Main API Server")]
#[OA\SecurityScheme(securityScheme: "bearerAuth", type: "http", scheme: "bearer", bearerFormat: "JWT")]
abstract class Controller
{
    //
}
