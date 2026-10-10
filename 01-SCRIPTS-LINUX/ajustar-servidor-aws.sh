#!/usr/bin/env bash
# Ajustes del servidor de AWS (nginx + PHP-FPM) para las fotos de evidencia.
# Se ejecuta EN el servidor. Se puede correr varias veces sin dañar nada.
#
#   ssh -i caprino-aws.pem ubuntu@SERVIDOR 'bash -s' < ajustar-servidor-aws.sh
#
# Qué hace:
#   1. Guarda una copia de la configuración actual en /etc/nginx/respaldos.
#   2. Saca de sites-enabled el archivo caprino.backup, que nginx cargaba como
#      un segundo sitio (aviso "conflicting server name").
#   3. Sube el límite de subida de 1 MB a 12 MB en nginx y a 10 MB en PHP.
#   4. Activa compresión y caché larga para los archivos del frontend.
#   5. Crea una carpeta fija para las fotos de bienestar y clasificación
#      lineal, fuera del código, y la declara en el .env del backend.
set -e

SITIO=/etc/nginx/sites-available/caprino
ENV_BACKEND=/var/www/caprino/backend-symfony/.env
DATOS=/var/www/caprino-datos

sudo mkdir -p /etc/nginx/respaldos
sudo cp -p "$SITIO" "/etc/nginx/respaldos/caprino.$(date +%Y%m%d-%H%M%S)"

if [ -f /etc/nginx/sites-enabled/caprino.backup ]; then
  sudo mv /etc/nginx/sites-enabled/caprino.backup /etc/nginx/respaldos/caprino.backup-anterior
fi

if ! sudo grep -q client_max_body_size "$SITIO"; then
  sudo python3 - "$SITIO" <<'PY'
import sys
p = sys.argv[1]
s = open(p).read()
s = s.replace("    server_name _;\n", """    server_name _;

    # Fotos de evidencia (bienestar, lineal, animales): hasta 12 MB por subida
    client_max_body_size 12m;

    # Compresion de la web y de las respuestas de la API
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;
    gzip_vary on;
""", 1)
s = s.replace("    # API SYMFONY\n", """    # Archivos del frontend con nombre unico por version: cache larga
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # API SYMFONY
""", 1)
open(p, "w").write(s)
PY
fi

printf '; Proyecto Caprino: fotos de evidencia\nupload_max_filesize = 10M\npost_max_size = 12M\n' \
  | sudo tee /etc/php/8.2/fpm/conf.d/99-caprino.ini > /dev/null

sudo mkdir -p "$DATOS/uploads"
sudo chown -R www-data:www-data "$DATOS"
sudo chmod 750 "$DATOS" "$DATOS/uploads"
if ! grep -q '^APP_UPLOADS_DIR' "$ENV_BACKEND"; then
  printf '\n# Fotos de bienestar y clasificacion lineal (se entregan por la API con token)\nAPP_UPLOADS_DIR=%s/uploads\n' "$DATOS" >> "$ENV_BACKEND"
fi

sudo nginx -t
sudo systemctl reload nginx
sudo systemctl reload php8.2-fpm

echo
echo "Listo. Comprobaciones:"
printf '  API:            '; curl -s -m 10 http://localhost/api/health; echo
printf '  Web:            '; curl -s -o /dev/null -w '%{http_code}\n' http://localhost/
printf '  Subida de 3 MB: '; head -c 3000000 /dev/urandom > /tmp/prueba.bin
curl -s -o /dev/null -w '%{http_code} (401 = pasa el limite; 413 = sigue bloqueada)\n' \
  -X POST http://localhost/api/bienestar/1/foto -F "file=@/tmp/prueba.bin;type=image/jpeg"
rm -f /tmp/prueba.bin
