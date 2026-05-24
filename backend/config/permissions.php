<?php

return [
    'api' => [
        'global_setting_access' => [
            'api.global.setting.is_hard_deleted' => 'Check if a record is hard deleted',
        ],
        'super_admin_access' => [
            'api.super_admin.access' => 'Full Access to All API Endpoints'
        ],
        'dashboard_access' => [
            'api.dashboard.view' => 'View Dashboard'
        ],
        'tenant_access' => [
            'api.tenant.view' => 'View Tenants',
            'api.tenant.create' => 'Create Tenants',
            'api.tenant.update' => 'Edit Tenants',
            'api.tenant.delete' => 'Delete Tenants',
            'api.tenant.assign_user' => 'Assign User to Tenant'
        ],
        'user_access' => [
            'api.user.view' => 'View Users',
            'api.user.create' => 'Create Users',
            'api.user.update' => 'Edit Users',
            'api.user.delete' => 'Delete Users',
            'api.user.assign_role' => 'Assign Role to User'
        ],
        'role_permission_access' => [
            'api.role.view' => 'View Roles',
            'api.role.create' => 'Create Roles',
            'api.role.update' => 'Edit Roles',
            'api.role.delete' => 'Delete Roles',
            'api.permission.view' => 'Show Permissions',
            'api.permission.assign' => 'Map Permissions with Role'
        ],
        'app_settings_access' => [
            'api.settings.view' => 'View Settings',
            'api.settings.update' => 'Edit Settings',
        ],
    ],
];