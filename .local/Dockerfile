FROM php:8.4-apache

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git unzip gnupg cron \
    libzip-dev libpng-dev libjpeg-dev libonig-dev \
    libxml2-dev libpq-dev libicu-dev libfreetype6-dev \
    libcurl4-openssl-dev curl ca-certificates \
 && docker-php-ext-configure gd --with-jpeg --with-freetype \
 && docker-php-ext-install -j$(nproc) \
    bcmath pdo_mysql pdo_pgsql pgsql mbstring zip soap xml curl gd intl exif \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y nodejs \
 && node -v && npm -v

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php \
 && mv composer.phar /usr/local/bin/composer \
 && chmod +x /usr/local/bin/composer

# Enable Apache modules
RUN a2enmod rewrite

# Set working directory
WORKDIR /saaserp

# Create Laravel directories
RUN mkdir -p \
    /saaserp/src/storage \
    /saaserp/src/public/storage \
    /saaserp/src/bootstrap/cache

# Copy Apache configs
COPY .local/sites-enabled/ /etc/apache2/sites-enabled/

# Setup cron
COPY .local/saaserp-cron /etc/cron.d/saaserp-cron
RUN chmod 0644 /etc/cron.d/saaserp-cron \
 && crontab -u www-data /etc/cron.d/saaserp-cron

# Permissions (optimized)
RUN chown -R www-data:www-data /saaserp \
 && chmod -R 775 /saaserp/src/storage /saaserp/src/bootstrap/cache /saaserp/src/public/storage

# Entrypoint
COPY .local/run-saaserp-service.sh /run-saaserp-service.sh
RUN sed -i 's/\r$//' /run-saaserp-service.sh \
 && chmod +x /run-saaserp-service.sh

CMD ["/run-saaserp-service.sh"]