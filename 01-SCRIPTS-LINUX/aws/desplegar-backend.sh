#!/usr/bin/env bash
# Sube backend-symfony/src al servidor, limpia la caché de Symfony y recarga PHP.
# Antes guarda una copia de src y config en ~/respaldo-AAAAMMDD-HHMM del servidor.
set -euo pipefail
source "$(dirname "$0")/_comun.sh"
R="respaldo-$(date +%Y%m%d-%H%M)"
remoto "mkdir -p ~/$R && cp -a /var/www/caprino/backend-symfony/src /var/www/caprino/backend-symfony/config ~/$R/"
rsync -az --delete -e "ssh ${SSH_OPC[*]}" "$RAIZ/backend-symfony/src/" "$HOST:/var/www/caprino/backend-symfony/src/"
remoto 'cd /var/www/caprino/backend-symfony && sudo rm -rf var/cache/prod \
  && sudo -u www-data env TNS_ADMIN=/Caprino-Wallet APP_ENV=prod APP_DEBUG=0 php bin/console cache:clear -q \
  && sudo systemctl reload php8.2-fpm && curl -s -m 15 localhost/api/health'
echo; echo "Backend desplegado. Respaldo en el servidor: ~/$R"
