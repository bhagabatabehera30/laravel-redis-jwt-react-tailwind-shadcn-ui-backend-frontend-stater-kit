<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\Permission\Models\Permission;

class SyncPermissions extends Command
{
    protected $signature = 'app:sync-permissions';
    protected $description = 'Sync permissions from config to database';

    public function handle()
    {
        $permissions = config('permissions');

        foreach ($permissions as $guard => $modules) {
            foreach ($modules as $module => $perms) {
                foreach ($perms as $key => $label) {

                    Permission::updateOrCreate(
                        [
                            'name' => $key,
                            'guard_name' => $guard,
                        ],
                        [
                            'name' => $key,
                        ]
                    );

                    $this->info("Synced: {$key}");
                }
            }
        }

        $this->info('✅ All permissions synced!');
    }
}
