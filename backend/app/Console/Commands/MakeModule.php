<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class MakeModule extends Command
{
    protected $signature = 'app:make-module {name}';
    protected $description = 'Create a new domain module structure';

    public function handle()
    {
        $name = ucfirst($this->argument('name'));

        if (!$name) {
            $this->error("Module name is required!");
            return;
        }

        if (!$this->confirm("Create module {$name}?")) {
            return;
        }

        $basePath = app_path("Domains/{$name}");

        if (File::exists($basePath)) {
            $this->error("Module {$name} already exists!");
            return;
        }

        // Folder structure
        $folders = [
            "Models",
            "Http/Controllers",
            "Http/Requests",
            "Services",
            "Repositories",
            "Actions",
            "DTOs",
            "Policies",
            "Routes",
        ];

        foreach ($folders as $folder) {
            File::makeDirectory("{$basePath}/{$folder}", 0755, true);
        }

        // Namespaces
        $namespace = "App\\Domains\\{$name}";
        $controllerNamespace = "{$namespace}\\Http\\Controllers";

        // Create Controller
        File::put(
            "{$basePath}/Http/Controllers/{$name}Controller.php",
            <<<PHP
<?php

namespace {$controllerNamespace};

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class {$name}Controller extends Controller
{
    public function index()
    {
        return response()->json(['message' => '{$name} list']);
    }

    public function store(Request \$request)
    {
        return response()->json(['message' => '{$name} created']);
    }
}
PHP
        );

        // Create Service
        File::put(
            "{$basePath}/Services/{$name}Service.php",
            <<<PHP
<?php

namespace {$namespace}\Services;

class {$name}Service
{
    //
}
PHP
        );

        // Create Repository
        File::put(
            "{$basePath}/Repositories/{$name}Repository.php",
            <<<PHP
<?php

namespace {$namespace}\Repositories;

class {$name}Repository
{
    //
}
PHP
        );

        // Create Model
        File::put(
            "{$basePath}/Models/{$name}.php",
            <<<PHP
<?php

namespace {$namespace}\Models;

use Illuminate\Database\Eloquent\Model;

class {$name} extends Model
{
    protected \$guarded = [];
}
PHP
        );

        // Create API Routes
        File::put(
            "{$basePath}/Routes/api.php",
            <<<PHP
<?php

use Illuminate\Support\Facades\Route;
use {$controllerNamespace}\\{$name}Controller;

Route::prefix(strtolower('{$name}'))->group(function () {
    Route::get('/', [{$name}Controller::class, 'index']);
    Route::post('/', [{$name}Controller::class, 'store']);
});
PHP
        );

        // Create Web Routes (optional)
        File::put(
            "{$basePath}/Routes/web.php",
            <<<PHP
<?php

use Illuminate\Support\Facades\Route;

Route::get('/{$name}', function () {
    return "{$name} module web route";
});
PHP
        );

        $this->info("✅ Module {$name} created successfully!");
    }
}