#!/usr/bin/env bash
# ============================================================================
# 01-VERIFICAR-REQUISITOS.sh
# Verifica que todos los componentes necesarios estan instalados
# Uso: bash 01-VERIFICAR-REQUISITOS.sh
# ============================================================================

set -euo pipefail

VERDE='\033[0;32m'
AMARILLO='\033[1;33m'
ROJO='\033[0;31m'
CYAN='\033[0;36m'
GRIS='\033[0;37m'
NC='\033[0m'

ok()    { echo -e "    ${VERDE}[OK]${NC} $*"; }
warn()  { echo -e "    ${AMARILLO}[AVISO]${NC} $*"; }
error() { echo -e "    ${ROJO}[ERROR]${NC} $*"; TODO_OK=false; }
omit()  { echo -e "    ${GRIS}[OMITIDO]${NC} $*"; }

TODO_OK=true

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}   VERIFICACION DE REQUISITOS - Proyecto Caprino${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""

# ── 1. PHP ────────────────────────────────────────────────────────────────────
echo -e "${AMARILLO}[1] PHP 8.1 o superior...${NC}"
if command -v php &>/dev/null; then
    PHP_VER=$(php -r "echo PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION;")
    PHP_MAJOR=$(echo "$PHP_VER" | cut -d. -f1)
    if [ "$PHP_MAJOR" -ge 8 ]; then
        ok "$(php -v | head -1)"
    else
        error "PHP $PHP_VER - se requiere 8.1 o superior"
    fi
else
    error "PHP no encontrado - ejecuta 00-INSTALAR-PHP.sh"
fi
echo ""

# ── 2. Extension OCI8 ─────────────────────────────────────────────────────────
echo -e "${AMARILLO}[2] Extension OCI8 (Oracle para PHP)...${NC}"
if command -v php &>/dev/null; then
    if php -m 2>/dev/null | grep -q "^oci8$"; then
        ok "OCI8 cargado en PHP"
    else
        warn "OCI8 no cargado - ejecuta 03-INSTALAR-OCI8.sh"
    fi
else
    omit "PHP no disponible"
fi
echo ""

# ── 3. Oracle Instant Client ──────────────────────────────────────────────────
echo -e "${AMARILLO}[3] Oracle Instant Client...${NC}"
IC_CANDIDATOS=(
    "/opt/oracle/instantclient_21_14"
    "/opt/oracle/instantclient_21_13"
    "/opt/oracle/instantclient_21_3"
    "/usr/lib/oracle/21/client64/lib"
    "$HOME/oracle/instantclient_21_14"
)
IC_ENCONTRADO=""
for c in "${IC_CANDIDATOS[@]}"; do
    if [ -f "$c/libclntsh.so" ] || ls "$c"/libclntsh.so.* &>/dev/null 2>&1; then
        IC_ENCONTRADO="$c"; break
    fi
done

if ldconfig -p 2>/dev/null | grep -q "libclntsh"; then
    ok "libclntsh encontrada en ldconfig"
elif [ -n "$IC_ENCONTRADO" ]; then
    warn "Instant Client en '$IC_ENCONTRADO' pero no en ldconfig - ejecuta ldconfig o reinstala"
else
    error "Instant Client no encontrado - ejecuta 02-INSTALAR-INSTANT-CLIENT.sh"
fi
echo ""

# ── 4. sqlplus disponible ─────────────────────────────────────────────────────
echo -e "${AMARILLO}[4] sqlplus (SQL*Plus para Oracle)...${NC}"
if command -v sqlplus &>/dev/null; then
    ok "sqlplus encontrado: $(command -v sqlplus)"
else
    warn "sqlplus no encontrado - incluido en el paquete SQL*Plus de Instant Client"
fi
echo ""

# ── 5. Wallet y TNS_ADMIN ─────────────────────────────────────────────────────
echo -e "${AMARILLO}[5] Wallet Oracle Autonomous DB (TNS_ADMIN)...${NC}"
[ -f "$HOME/.oracle_env" ] && source "$HOME/.oracle_env" || true
TNS_ADMIN_VAL="${TNS_ADMIN:-}"

if [ -n "$TNS_ADMIN_VAL" ] && [ -f "$TNS_ADMIN_VAL/tnsnames.ora" ]; then
    ok "TNS_ADMIN = $TNS_ADMIN_VAL"
    TNS_NAMES=$(grep -E "^\w.*=\s*\(" "$TNS_ADMIN_VAL/tnsnames.ora" 2>/dev/null | cut -d= -f1 | tr -d ' ' | tr '\n' ',' | sed 's/,$//')
    [ -n "$TNS_NAMES" ] && ok "Servicios TNS: $TNS_NAMES"
elif [ -n "$TNS_ADMIN_VAL" ]; then
    error "TNS_ADMIN=$TNS_ADMIN_VAL pero tnsnames.ora no encontrado"
else
    error "TNS_ADMIN no configurado - ejecuta 02-CONFIGURAR-ORACLE-ENV.sh"
fi
echo ""

# ── 6. Node.js ────────────────────────────────────────────────────────────────
echo -e "${AMARILLO}[6] Node.js 18 o superior...${NC}"
if command -v node &>/dev/null; then
    NODE_VER=$(node --version)
    NODE_MAJOR=$(echo "$NODE_VER" | tr -d 'v' | cut -d. -f1)
    NPM_VER=$(npm --version 2>/dev/null || echo "no disponible")
    if [ "$NODE_MAJOR" -ge 18 ]; then
        ok "Node.js $NODE_VER / npm $NPM_VER"
    else
        warn "Node.js $NODE_VER - se recomienda v18 o superior"
    fi
else
    warn "Node.js no encontrado - ejecuta 00-INSTALAR-NODE.sh"
fi
echo ""

# ── 7. Composer ───────────────────────────────────────────────────────────────
echo -e "${AMARILLO}[7] Composer...${NC}"
if command -v composer &>/dev/null; then
    ok "$(composer --version 2>/dev/null | head -1)"
else
    warn "Composer no encontrado - ejecuta 03b-INSTALAR-COMPOSER.sh"
fi
echo ""

# ── 8. Puerto 8000 libre ──────────────────────────────────────────────────────
echo -e "${AMARILLO}[8] Puerto 8000 disponible para el backend...${NC}"
if ss -tlnp 2>/dev/null | grep -q ':8000 ' || netstat -tlnp 2>/dev/null | grep -q ':8000 '; then
    warn "Puerto 8000 en uso - el backend podria no iniciar"
else
    ok "Puerto 8000 libre"
fi
echo ""

echo -e "${CYAN}============================================================${NC}"
if $TODO_OK; then
    echo -e "${VERDE}   RESULTADO: Todos los requisitos criticos estan OK${NC}"
else
    echo -e "${AMARILLO}   RESULTADO: Faltan componentes - revisa los marcados en rojo${NC}"
fi
echo -e "${CYAN}============================================================${NC}"
echo ""
