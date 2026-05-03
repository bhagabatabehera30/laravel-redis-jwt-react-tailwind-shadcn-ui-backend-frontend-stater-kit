<?php

if (!function_exists('permission_label')) {
    function permission_label($permission)
    {
        return collect(config('permissions'))
            ->flatten(2)
            ->get($permission, $permission);
    }
}
