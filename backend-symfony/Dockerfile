# Dockerfile para Backend Symfony
FROM php:8.2-fpm

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libicu-dev \
    libonig-dev \
    libxml2-dev \
    wget \
    libaio1 \
    && docker-php-ext-install \
    pdo \
    intl \
    zip \
    opcache \
    mbstring \
    xml

# Instalar Oracle Instant Client
RUN mkdir -p /opt/oracle \
    && cd /opt/oracle \
    && wget https://download.oracle.com/otn_software/linux/instantclient/instantclient-basiclite-linuxx64.zip \
    && unzip instantclient-basiclite-linuxx64.zip \
    && rm instantclient-basiclite-linuxx64.zip \
    && echo /opt/oracle/instantclient* > /etc/ld.so.conf.d/oracle-instantclient.conf \
    && ldconfig

# Instalar extensión OCI8
RUN docker-php-ext-configure pdo_oci --with-pdo-oci=instantclient,/opt/oracle/instantclient_21_1 \
    && docker-php-ext-install pdo_oci

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Instalar Symfony CLI
RUN wget https://get.symfony.com/cli/installer -O - | bash \
    && mv /root/.symfony*/bin/symfony /usr/local/bin/symfony

# Configurar directorio de trabajo
WORKDIR /app

# Copiar archivos
COPY . .

# Instalar dependencias PHP
RUN composer install --no-interaction --optimize-autoloader

# Configurar permisos
RUN chown -R www-data:www-data /app/var

# Exponer puerto
EXPOSE 8000

# Comando por defecto
CMD ["symfony", "server:start", "--no-tls", "--port=8000"]
