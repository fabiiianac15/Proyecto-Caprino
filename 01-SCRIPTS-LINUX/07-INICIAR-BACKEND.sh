#!/usr/bin/env bash
# ============================================================================
# 07-INICIAR-BACKEND.sh
# Inicia el servidor PHP del backend en puerto 8000
# Uso: bash 07-INICIAR-BACKEND.sh
# Dejar corriendo en una terminal. Ctrl+C para detener.
# ============================================================================

set -euo pipefail

VERDE='\033[0;32m'
AMARILLO='\033[1;33m'
ROJO='\033[0;31m'
CYAN='\033[0;36m'
GRIS='\033[0;37m'
NC='\033[0m'

ok()    { echo -e "${VERDE}[OK]${NC} $*"; }
warn()  { echo -e "${AMARILLO}[AVISO]${NC} $*"; }
error() { echo -e "${ROJO}[ERROR]${NC} $*"; exit 1; }
info()  { echo -e "${GRIS}$*${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PUBLIC_DIR="$PROJECT_ROOT/backend-symfony/public"
IC_DIR="/opt/oracle/instantclient_21_14"

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}   INICIAR BACKEND - Servidor PHP${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""

# Cargar variables de Oracle
[ -f "$HOME/.oracle_env" ] && source "$HOME/.oracle_env" || true
export LD_LIBRARY_PATH="${IC_DIR}${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
export PATH="$PATH:$IC_DIR"

info "Raiz publica: $PUBLIC_DIR"
echo ""

# ── Verificaciones ────────────────────────────────────────────────────────────
if [ ! -d "$PUBLIC_DIR" ]; then
    error "Directorio publico no encontrado: $PUBLIC_DIR"
fi

if ! command -v php &>/dev/null; then
    error "PHP no encontrado en PATH. Ejecuta 00-INSTALAR-PHP.sh primero."
fi

# Verificar OCI8 (aviso, no bloquea)
if ! php -m 2>/dev/null | grep -q "^oci8$"; then
    warn "OCI8 no cargado en PHP - la conexion a Oracle fallara."
    warn "Ejecuta 03-INSTALAR-OCI8.sh si no lo has hecho."
    echo ""
fi

# Verificar si el puerto 8000 ya esta en uso
if ss -tlnp 2>/dev/null | grep -q ':8000 ' || netstat -tlnp 2>/dev/null | grep -q ':8000 ' 2>/dev/null; then
    warn "El puerto 8000 ya esta en uso."
    warn "Puede que el backend ya este corriendo, o cierra el proceso que lo usa."
    echo ""
fi

# Preparar directorio de logs
LOGS_DIR="$PROJECT_ROOT/01-SCRIPTS-LINUX/logs"
mkdir -p "$LOGS_DIR"
LOG_FILE="$LOGS_DIR/backend-$(date '+%Y-%m-%d_%H-%M-%S').log"

info "Log: $LOG_FILE"
echo ""
echo "------------------------------------------------------------"
echo " Puerto : 8000"
echo " URL    : http://localhost:8000"
echo " API    : http://localhost:8000/api"
echo "------------------------------------------------------------"
echo ""
echo "Presiona Ctrl+C para detener el servidor."
echo ""

cd "$PUBLIC_DIR"
php -S localhost:8000 -t . 2>&1 | tee "$LOG_FILE"
