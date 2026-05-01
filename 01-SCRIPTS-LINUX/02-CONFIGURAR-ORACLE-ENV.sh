#!/usr/bin/env bash
# ============================================================================
# 02-CONFIGURAR-ORACLE-ENV.sh
# Configura el wallet de Oracle Autonomous DB y la variable TNS_ADMIN
# Uso: bash 02-CONFIGURAR-ORACLE-ENV.sh
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

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}   CONFIGURAR WALLET - Oracle Autonomous DB${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""
info "Este script configura la conexion a Oracle Autonomous DB."
info "Necesitas tener el wallet descargado desde Oracle Cloud Console."
info "  ADB -> DB Connection -> Download Wallet"
info "Extrae el ZIP en una carpeta local (ej: ~/caprino-wallet)"
echo ""

IC_DIR="/opt/oracle/instantclient_21_14"

# ── 1. Verificar Oracle Instant Client ───────────────────────────────────────
echo -e "${AMARILLO}[1/4] Verificando Oracle Instant Client...${NC}"

IC_CANDIDATOS=(
    "/opt/oracle/instantclient_21_14"
    "/opt/oracle/instantclient_21_13"
    "/opt/oracle/instantclient_21_3"
    "/usr/lib/oracle/21/client64/lib"
    "$HOME/oracle/instantclient_21_14"
)

IC_ENCONTRADO=""
for c in "${IC_CANDIDATOS[@]}"; do
    if ls "$c"/libclntsh.so* &>/dev/null 2>&1; then
        IC_ENCONTRADO="$c"; break
    fi
done

if [ -z "$IC_ENCONTRADO" ] && ldconfig -p 2>/dev/null | grep -q "libclntsh"; then
    IC_ENCONTRADO="(en ldconfig del sistema)"
fi

if [ -n "$IC_ENCONTRADO" ]; then
    ok "Instant Client encontrado: $IC_ENCONTRADO"
else
    error "Oracle Instant Client no encontrado. Ejecuta primero: bash 02-INSTALAR-INSTANT-CLIENT.sh"
fi
echo ""

# ── 2. Ubicar el wallet ───────────────────────────────────────────────────────
echo -e "${AMARILLO}[2/4] Ubicando wallet de Oracle Autonomous DB...${NC}"
echo ""

WALLET_CANDIDATOS=(
    "$HOME/Caprino-Wallet"
    "$HOME/caprino-wallet"
    "$HOME/wallet"
    "$HOME/Wallet"
    "$HOME/Downloads/wallet"
    "$HOME/Downloads/Wallet"
    "/opt/oracle/wallet"
    "/etc/oracle/wallet"
)

WALLET_ENCONTRADO=""
for c in "${WALLET_CANDIDATOS[@]}"; do
    if [ -f "$c/tnsnames.ora" ]; then
        WALLET_ENCONTRADO="$c"; break
    fi
done

if [ -n "$WALLET_ENCONTRADO" ]; then
    echo -e "  Wallet encontrado en: ${VERDE}${WALLET_ENCONTRADO}${NC}"
    read -rp "  Usar esta ruta? (s/n): " RESP
    if [[ ! "$RESP" =~ ^[sS]$ ]]; then
        WALLET_ENCONTRADO=""
    fi
fi

if [ -z "$WALLET_ENCONTRADO" ]; then
    read -rp "  Ingresa la ruta donde extrajiste el wallet (ej: ~/Caprino-Wallet): " WALLET_INPUT
    # Expandir tilde y eliminar comillas o espacios que el usuario haya pegado
    WALLET_INPUT="${WALLET_INPUT/#\~/$HOME}"
    WALLET_INPUT="${WALLET_INPUT%/}"   # quitar barra final si la hay
    WALLET_INPUT=$(echo "$WALLET_INPUT" | tr -d '"' | tr -d "'")

    if [ ! -f "$WALLET_INPUT/tnsnames.ora" ]; then
        echo ""
        error "No se encontro tnsnames.ora en: $WALLET_INPUT
  Verifica que el wallet este correctamente extraido en esa carpeta.
  Tip: ls \"$WALLET_INPUT\" deberia mostrar tnsnames.ora, cwallet.sso, etc."
    fi
    WALLET_ENCONTRADO="$WALLET_INPUT"
fi

ok "Wallet valido en: $WALLET_ENCONTRADO"
echo ""

# ── 3. Actualizar sqlnet.ora ──────────────────────────────────────────────────
echo -e "${AMARILLO}[3/4] Actualizando sqlnet.ora...${NC}"

cat > "$WALLET_ENCONTRADO/sqlnet.ora" <<EOF
WALLET_LOCATION = (SOURCE = (METHOD = file)(METHOD_DATA = (DIRECTORY="${WALLET_ENCONTRADO}")))
SSL_SERVER_DN_MATCH=yes
SQLNET.WALLET_OVERRIDE=TRUE
EOF

ok "sqlnet.ora actualizado con WALLET_LOCATION = $WALLET_ENCONTRADO"
echo ""

# ── 4. Configurar variables de entorno ────────────────────────────────────────
echo -e "${AMARILLO}[4/4] Configurando variables de entorno...${NC}"

# Escribir en ~/.oracle_env (sin guardia de shell interactivo)
# ~/.bashrc suele tener "case $-" que impide que se cargue desde scripts no interactivos.
# Por eso usamos un archivo separado que los scripts pueden sourcer directamente.
ORACLE_ENV_FILE="$HOME/.oracle_env"

cat > "$ORACLE_ENV_FILE" <<EOF
# Generado por 02-CONFIGURAR-ORACLE-ENV.sh - no editar manualmente
export TNS_ADMIN="${WALLET_ENCONTRADO}"
export NLS_LANG="AMERICAN_AMERICA.AL32UTF8"
export LD_LIBRARY_PATH="/opt/oracle/instantclient_21_14\${LD_LIBRARY_PATH:+:\$LD_LIBRARY_PATH}"
export PATH="\$PATH:/opt/oracle/instantclient_21_14"
EOF

ok "Variables Oracle guardadas en $ORACLE_ENV_FILE"

# Agregar source al .bashrc / .zshrc para sesiones interactivas
for SHELL_RC in "$HOME/.bashrc" "$HOME/.bash_profile" "$HOME/.zshrc"; do
    if [ -f "$SHELL_RC" ] && ! grep -q "oracle_env" "$SHELL_RC"; then
        echo "" >> "$SHELL_RC"
        echo "# Oracle Instant Client + Wallet" >> "$SHELL_RC"
        echo "[ -f \"$ORACLE_ENV_FILE\" ] && source \"$ORACLE_ENV_FILE\"" >> "$SHELL_RC"
        info "  Agregado source a $SHELL_RC"
    fi
done

# Exportar en la sesion actual del script
export TNS_ADMIN="${WALLET_ENCONTRADO}"
export NLS_LANG="AMERICAN_AMERICA.AL32UTF8"

ok "TNS_ADMIN = $WALLET_ENCONTRADO"
ok "NLS_LANG  = AMERICAN_AMERICA.AL32UTF8"
echo ""

# ── Mostrar TNS names disponibles ─────────────────────────────────────────────
echo -e "${CYAN}Servicios TNS disponibles en el wallet:${NC}"
TNS_NAMES=$(grep -E "^\w.*=\s*\(" "$WALLET_ENCONTRADO/tnsnames.ora" 2>/dev/null | cut -d= -f1 | tr -d ' ' || echo "")

if [ -n "$TNS_NAMES" ]; then
    echo "$TNS_NAMES" | while read -r tns; do
        echo "  - $tns"
    done
    DEFAULT_TNS=$(echo "$TNS_NAMES" | grep "_high$" | head -1 || echo "$TNS_NAMES" | head -1)
else
    warn "(no se pudieron leer - verifica tnsnames.ora)"
    DEFAULT_TNS="caprinodb_high"
fi
echo ""

# ── Actualizar .env del backend ───────────────────────────────────────────────
echo -e "${AMARILLO}Actualizando backend/.env con la ruta del wallet...${NC}"

BACKEND_ENV="$PROJECT_ROOT/backend-symfony/.env"
if [ -f "$BACKEND_ENV" ]; then
    # Reemplazar las lineas de wallet y TNS en el .env
    sed -i "s|^DATABASE_WALLET_PATH=.*|DATABASE_WALLET_PATH=${WALLET_ENCONTRADO}|" "$BACKEND_ENV"
    if [ -n "$DEFAULT_TNS" ]; then
        sed -i "s|^DATABASE_TNS_NAME=.*|DATABASE_TNS_NAME=${DEFAULT_TNS}|" "$BACKEND_ENV"
    fi
    ok ".env actualizado (DATABASE_WALLET_PATH, DATABASE_TNS_NAME)"
else
    warn "backend/.env no encontrado - actualiza DATABASE_WALLET_PATH manualmente"
fi

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${VERDE}   WALLET CONFIGURADO${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""
info "  Instant Client : $IC_ENCONTRADO"
info "  Wallet         : $WALLET_ENCONTRADO"
info "  TNS_ADMIN      : $WALLET_ENCONTRADO"
[ -n "${DEFAULT_TNS:-}" ] && info "  TNS default    : $DEFAULT_TNS"
echo ""
echo "IMPORTANTE: Abre una nueva terminal (o ejecuta: source ~/.bashrc)"
echo "para que TNS_ADMIN surta efecto."
echo ""
echo "Siguiente paso: bash 02b-CREAR-USUARIO-ORACLE.sh"
echo ""
