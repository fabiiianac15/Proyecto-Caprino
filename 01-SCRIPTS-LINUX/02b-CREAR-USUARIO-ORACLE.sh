#!/usr/bin/env bash
# ============================================================================
# 02b-CREAR-USUARIO-ORACLE.sh
# Crea el usuario caprino_user en Oracle Autonomous DB y crea las tablas
# Requiere: Instant Client instalado + wallet configurado (TNS_ADMIN)
# Uso: bash 02b-CREAR-USUARIO-ORACLE.sh
# ============================================================================

set -euo pipefail

VERDE='\033[0;32m'
AMARILLO='\033[1;33m'
ROJO='\033[0;31m'
CYAN='\033[0;36m'
GRIS='\033[0;37m'
NC='\033[0m'

ok()    { echo -e "  ${VERDE}[OK]${NC} $*"; }
warn()  { echo -e "  ${AMARILLO}[AVISO]${NC} $*"; }
error() { echo -e "  ${ROJO}[ERROR]${NC} $*"; exit 1; }
info()  { echo -e "  ${GRIS}$*${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DB_SCRIPTS="$PROJECT_ROOT/base-de-datos"

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}   CREAR USUARIO Y TABLAS EN ORACLE AUTONOMOUS DB${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""

# Cargar variables de Oracle (archivo sin guardia de shell interactivo)
# ~/.bashrc tiene "case $-" que impide cargarse desde scripts no interactivos
[ -f "$HOME/.oracle_env" ] && source "$HOME/.oracle_env" || true

# ── Verificar sqlplus ─────────────────────────────────────────────────────────
IC_DIR="/opt/oracle/instantclient_21_14"
export PATH="$PATH:$IC_DIR"
export LD_LIBRARY_PATH="${IC_DIR}${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"

if ! command -v sqlplus &>/dev/null; then
    error "sqlplus no encontrado en PATH. Ejecuta primero: bash 02-INSTALAR-INSTANT-CLIENT.sh"
fi
ok "sqlplus disponible"

# ── Verificar TNS_ADMIN ───────────────────────────────────────────────────────
if [ -z "${TNS_ADMIN:-}" ] || [ ! -f "${TNS_ADMIN}/tnsnames.ora" ]; then
    error "TNS_ADMIN no configurado o wallet no encontrado. Ejecuta primero: bash 02-CONFIGURAR-ORACLE-ENV.sh"
fi
ok "Wallet en: $TNS_ADMIN"
echo ""

# ── Leer TNS name del .env ────────────────────────────────────────────────────
BACKEND_ENV="$PROJECT_ROOT/backend-symfony/.env"
TNS_NAME="caprinodb_high"
if [ -f "$BACKEND_ENV" ]; then
    TN=$(grep "^DATABASE_TNS_NAME=" "$BACKEND_ENV" | cut -d= -f2 | tr -d '"' | tr -d "'")
    [ -n "$TN" ] && TNS_NAME="$TN"
fi
echo -e "${CYAN}Usando TNS alias: $TNS_NAME${NC}"
echo ""

# ── Credenciales del usuario ADMIN ───────────────────────────────────────────
echo -e "${AMARILLO}Se necesitan las credenciales del usuario ADMIN de Oracle Autonomous DB.${NC}"
info "(Es la password que configuraste al crear el ADB en Oracle Cloud)"
echo ""
read -rsp "Password del usuario ADMIN: " ADMIN_PWD
echo ""

# Funcion auxiliar: ejecutar SQL via sqlplus /nolog
invoke_sqlplus() {
    local user="$1"
    local password="$2"
    local tns="$3"
    local sql="$4"
    local tmp_file
    tmp_file=$(mktemp /tmp/caprino_XXXXXX.sql)
    printf 'CONNECT %s/"%s"@%s\n%s\n' "$user" "$password" "$tns" "$sql" > "$tmp_file"
    local out
    out=$("$IC_DIR/sqlplus" -S /nolog "@$tmp_file" 2>&1 || true)
    rm -f "$tmp_file"
    echo "$out"
}

# ── Verificar conexion ────────────────────────────────────────────────────────
echo ""
echo -e "${AMARILLO}Verificando conexion a Oracle Autonomous DB...${NC}"
info "  TNS_ADMIN = $TNS_ADMIN"
info "  Alias     = $TNS_NAME"

TEST_OUT=$(invoke_sqlplus "ADMIN" "$ADMIN_PWD" "$TNS_NAME" "SELECT 'CONEXION_OK' FROM DUAL;
EXIT;")

if ! echo "$TEST_OUT" | grep -q "CONEXION_OK"; then
    error "No se pudo conectar al ADB.
Salida de sqlplus:
$TEST_OUT

Verifica:
  1. La password del usuario ADMIN es correcta
  2. El wallet esta configurado (TNS_ADMIN=$TNS_ADMIN)
  3. El alias '$TNS_NAME' existe en tnsnames.ora
  4. Tienes conexion a internet"
fi
ok "Conexion exitosa al Autonomous DB"
echo ""

# ── PASO 1: Crear usuario caprino_user ───────────────────────────────────────
echo -e "${AMARILLO}Paso 1/3: Creando usuario caprino_user...${NC}"

CAPRINO_PASSWORD="CaprinoPass2025!"

SQL_CREAR_USUARIO="CREATE USER caprino_user IDENTIFIED BY \"${CAPRINO_PASSWORD}\"
  DEFAULT TABLESPACE data
  QUOTA UNLIMITED ON data;

GRANT CONNECT TO caprino_user;
GRANT RESOURCE TO caprino_user;
GRANT CREATE SESSION TO caprino_user;
GRANT CREATE TABLE TO caprino_user;
GRANT CREATE VIEW TO caprino_user;
GRANT CREATE SEQUENCE TO caprino_user;
GRANT CREATE TRIGGER TO caprino_user;
GRANT CREATE PROCEDURE TO caprino_user;
GRANT UNLIMITED TABLESPACE TO caprino_user;

SELECT 'USUARIO_CREADO' FROM DUAL;
EXIT;"

OUT1=$(invoke_sqlplus "ADMIN" "$ADMIN_PWD" "$TNS_NAME" "$SQL_CREAR_USUARIO")
ERRORES1=$(echo "$OUT1" | grep "ORA-" | grep -v "ORA-01920" || true)

if [ -n "$ERRORES1" ]; then
    warn "$ERRORES1"
    warn "(Si el usuario ya existia esto es normal)"
else
    ok "caprino_user listo"
fi

# Guardar password en .env
if [ -f "$BACKEND_ENV" ]; then
    sed -i "s|^DATABASE_USER=.*|DATABASE_USER=caprino_user|" "$BACKEND_ENV"
    sed -i "s|^DATABASE_PASSWORD=.*|DATABASE_PASSWORD=${CAPRINO_PASSWORD}|" "$BACKEND_ENV"
    ok "Credenciales guardadas en backend/.env"
fi
echo ""

# ── PASO 2: Ejecutar scripts SQL del esquema ──────────────────────────────────
echo -e "${AMARILLO}Paso 2/3: Creando tablas del sistema...${NC}"

declare -A SQL_SCRIPTS=(
    ["esquemas/01-tablas-principales.sql"]="Tablas principales"
    ["esquemas/02-datos-iniciales-razas.sql"]="Razas caprinas"
    ["esquemas/03-datos-iniciales-usuarios.sql"]="Usuarios iniciales"
    ["procedimientos/01-triggers-y-funciones.sql"]="Triggers y funciones"
    ["vistas/01-vistas-reportes.sql"]="Vistas para reportes"
)

ORDEN_SCRIPTS=(
    "esquemas/01-tablas-principales.sql"
    "esquemas/02-datos-iniciales-razas.sql"
    "esquemas/03-datos-iniciales-usuarios.sql"
    "procedimientos/01-triggers-y-funciones.sql"
    "vistas/01-vistas-reportes.sql"
)

for archivo in "${ORDEN_SCRIPTS[@]}"; do
    desc="${SQL_SCRIPTS[$archivo]}"
    ruta="$DB_SCRIPTS/$archivo"

    if [ ! -f "$ruta" ]; then
        warn "No encontrado: $archivo - saltando"
        continue
    fi

    info "  Ejecutando: $desc..."
    tmp_wrap=$(mktemp /tmp/caprino_XXXXXX.sql)
    printf 'CONNECT caprino_user/"%s"@%s\n@"%s"\nEXIT;\n' "$CAPRINO_PASSWORD" "$TNS_NAME" "$ruta" > "$tmp_wrap"
    OUT_SQL=$("$IC_DIR/sqlplus" -S /nolog "@$tmp_wrap" 2>&1 || true)
    rm -f "$tmp_wrap"

    ERR_SQL=$(echo "$OUT_SQL" | grep "ORA-" | grep -v "ORA-00955\|ORA-01430\|ORA-01442\|ORA-02260\|ORA-02261\|ORA-02275\|ORA-04043\|ORA-00001" || true)
    if [ -n "$ERR_SQL" ]; then
        warn "$ERR_SQL"
    else
        ok "$desc"
    fi
done
echo ""

# ── PASO 3: Verificar tablas creadas ─────────────────────────────────────────
echo -e "${AMARILLO}Paso 3/3: Verificando tablas...${NC}"
OUT_VERIF=$(invoke_sqlplus "caprino_user" "$CAPRINO_PASSWORD" "$TNS_NAME" "SELECT COUNT(*) AS TOTAL_TABLAS FROM USER_TABLES;
EXIT;")
NUM_TABLAS=$(echo "$OUT_VERIF" | grep -E "^\s*[0-9]+" | head -1 | tr -d ' ' || echo "?")
ok "Tablas en caprino_user: $NUM_TABLAS"

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${VERDE}   BASE DE DATOS CONFIGURADA EN ORACLE AUTONOMOUS DB${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""
echo -e "${CYAN}Conexion:${NC}"
info "  Usuario  : caprino_user"
info "  Password : $CAPRINO_PASSWORD"
info "  TNS      : $TNS_NAME"
info "  Wallet   : $TNS_ADMIN"
echo ""
echo -e "${CYAN}Credenciales de acceso al sistema:${NC}"
info "  admin@caprino.com / Admin123!"
echo ""
