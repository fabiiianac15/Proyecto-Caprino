#!/usr/bin/env bash
# Compila frontend-web (la API queda en la misma dirección: /api) y lo sube a /var/www/frontend.
set -euo pipefail
source "$(dirname "$0")/_comun.sh"
cd "$RAIZ/frontend-web"
VITE_API_URL=/api npx vite build
remoto "cp -a /var/www/frontend ~/respaldo-web-$(date +%Y%m%d-%H%M)"
rsync -az --delete -e "ssh ${SSH_OPC[*]}" dist/ "$HOST:/var/www/frontend/"
curl -s -o /dev/null -w "Web: HTTP %{http_code}\n" "http://$SERVIDOR/"
