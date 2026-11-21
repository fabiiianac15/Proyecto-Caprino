#!/usr/bin/env bash
# Variables comunes de los scripts de AWS. Se pueden cambiar con variables de entorno:
#   CAPRIVA_SERVIDOR=3.95.12.233  CAPRIVA_LLAVE=~/Descargas/Claves/caprino-aws.pem
SERVIDOR="${CAPRIVA_SERVIDOR:-3.95.12.233}"
LLAVE="${CAPRIVA_LLAVE:-$HOME/Descargas/Claves/caprino-aws.pem}"
HOST="ubuntu@$SERVIDOR"
SSH_OPC=(-i "$LLAVE" -o BatchMode=yes -o ServerAliveInterval=30)
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
remoto() { ssh "${SSH_OPC[@]}" "$HOST" "$@"; }
