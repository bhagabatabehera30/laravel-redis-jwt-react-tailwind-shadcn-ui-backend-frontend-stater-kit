#!/usr/bin/env bash 

# chown -R bhagabat:bhagabat /home/bhagabat/docker_php_apps/laravel_erp_frontend_backend/
#git config --global --add safe.directory /saaserp/src
chown -R www-data:www-data /saaserp/src   # in production open this 
cd /saaserp/src/
composer install
npm install
php artisan migrate
php artisan db:seed # for deve
npm run build # for production & dev for development
service cron start
# Create required Laravel directories
mkdir -p storage/framework/cache/data \
         storage/framework/sessions \
         storage/framework/views \
         bootstrap/cache

# Set correct permissions
chown -R www-data:www-data storage bootstrap/cache public/storage
chmod -R 775 storage bootstrap/cache public/storage

# Clear caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan storage:link

#php artisan serve --host=0.0.0.0 --port=80
#php artisan serve
#npm run dev -- --host # build : for production & dev for development
apache2-foreground
# apachectl -D FOREGROUND