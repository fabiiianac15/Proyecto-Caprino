# Dockerfile para Backend Symfony con PHP-FPM
FROM php:8.2-fpm

# Instalar dependencias del sistema incluyendo nginx
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libicu-dev \
    libonig-dev \
    libxml2-dev \
    wget \
    libaio-dev \
    alien \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Instalar extensiones PHP básicas
RUN docker-php-ext-install \
    pdo \
    intl \
    zip \
    opcache \
    mbstring \
    xml

# Instalar Oracle Instant Client 21.1 (versión específica compatible)
RUN mkdir -p /opt/oracle \
    && cd /opt/oracle \
    && wget https://download.oracle.com/otn_software/linux/instantclient/211000/instantclient-basic-linux.x64-21.1.0.0.0.zip \
    && wget https://download.oracle.com/otn_software/linux/instantclient/211000/instantclient-sdk-linux.x64-21.1.0.0.0.zip \
    && unzip instantclient-basic-linux.x64-21.1.0.0.0.zip \
    && unzip instantclient-sdk-linux.x64-21.1.0.0.0.zip \
    && rm *.zip \
    && echo /opt/oracle/instantclient_21_1 > /etc/ld.so.conf.d/oracle-instantclient.conf \
    && ldconfig \
    && ln -s /usr/lib/x86_64-linux-gnu/libaio.so.1t64 /usr/lib/x86_64-linux-gnu/libaio.so.1 || true

# Instalar extensiones OCI8 y PDO_OCI  
RUN docker-php-ext-configure oci8 --with-oci8=instantclient,/opt/oracle/instantclient_21_1 \
    && docker-php-ext-install oci8 \
    && docker-php-ext-configure pdo_oci --with-pdo-oci=instantclient,/opt/oracle/instantclient_21_1 \
    && docker-php-ext-install pdo_oci

# Deshabilitar OCI8 por defecto (causa Segmentation Fault en warmup)
# Se habilitará solo para PDO_OCI que es más estable
RUN mv /usr/local/etc/php/conf.d/docker-php-ext-oci8.ini /usr/local/etc/php/conf.d/docker-php-ext-oci8.ini.disabled

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Configurar directorio de trabajo
WORKDIR /app

# Copiar archivos
COPY . .

# Instalar dependencias PHP (sin ejecutar scripts que requieran DB)
# Las extensiones OCI8 están instaladas y funcionarán en runtime
RUN composer install --no-interaction --optimize-autoloader --ignore-platform-req=ext-oci8 --no-scripts

# Crear directorio var y configurar permisos
RUN mkdir -p /app/var && chown -R www-data:www-data /app/var

# Configurar Nginx
RUN rm /etc/nginx/sites-enabled/default
COPY nginx.conf /etc/nginx/sites-available/symfony.conf
RUN ln -s /etc/nginx/sites-available/symfony.conf /etc/nginx/sites-enabled/symfony.conf

# Configurar Supervisor para manejar nginx y php-fpm
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Exponer puerto
EXPOSE 8000

# Comando: iniciar supervisor que manejará nginx y php-fpm
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
