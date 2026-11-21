#!/usr/bin/env bash
# Ejecuta un archivo .sql en la base Oracle del servidor con sqlplus.
# Uso: ./ejecutar-sql.sh ../../base-de-datos/esquemas/14-clasificacion-lineal-medidas.sql
# Las credenciales se leen del .env del backend EN el servidor (no viajan).
# NLS_LANG en UTF-8 es obligatorio: sin él, las tildes y la ñ se guardan dañadas.
set -euo pipefail
source "$(dirname "$0")/_comun.sh"
[ -f "${1:-}" ] || { echo "Uso: $0 archivo.sql"; exit 1; }
scp -q "${SSH_OPC[@]}" "$1" "$HOST:/tmp/capriva.sql"
remoto 'ENV=/var/www/caprino/backend-symfony/.env
U=$(grep -E "^DATABASE_USER=" $ENV | cut -d= -f2- | tr -d "\"'"'"'")
P=$(grep -E "^DATABASE_PASSWORD=" $ENV | cut -d= -f2- | tr -d "\"'"'"'")
T=$(grep -E "^DATABASE_TNS_NAME=" $ENV | cut -d= -f2- | tr -d "\"'"'"'")
export NLS_LANG=AMERICAN_AMERICA.AL32UTF8 TNS_ADMIN=/Caprino-Wallet LD_LIBRARY_PATH=/opt/oracle/instantclient_21_14
/opt/oracle/instantclient_21_14/sqlplus -S /nolog <<SQL
WHENEVER SQLERROR EXIT FAILURE
CONNECT $U/"$P"@$T
SET SERVEROUTPUT ON
@/tmp/capriva.sql
EXIT
SQL
rm -f /tmp/capriva.sql'
