#!/usr/bin/env bash
# ============================================================================
# 08-INICIAR-FRONTEND.sh
# Inicia el servidor Vite del frontend en puerto 5173
# Uso: bash 08-INICIAR-FRONTEND.sh
# Dejar corriendo en una NUEVA terminal (diferente de la del backend). Ctrl+C para detener.
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
FRONTEND_DIR="$PROJECT_ROOT/frontend-web"

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}   INICIAR FRONTEND - Servidor Vite (React)${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""

# Cargar nvm si esta disponible
NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" || true

info "Frontend: $FRONTEND_DIR"
echo ""

# ── Verificaciones ────────────────────────────────────────────────────────────
if [ ! -d "$FRONTEND_DIR" ]; then
    error "Directorio frontend no encontrado: $FRONTEND_DIR"
fi

if [ ! -f "$FRONTEND_DIR/package.json" ]; then
    error "package.json no encontrado en $FRONTEND_DIR"
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    error "node_modules no instalado. Ejecuta primero: bash 05-INSTALAR-DEPENDENCIAS-FRONTEND.sh"
fi

if ! command -v node &>/dev/null; then
    error "Node.js no encontrado en PATH. Ejecuta primero: bash 00-INSTALAR-NODE.sh"
fi

ok "Dependencias verificadas"
echo ""

# Preparar directorio de logs
LOGS_DIR="$PROJECT_ROOT/01-SCRIPTS-LINUX/logs"
mkdir -p "$LOGS_DIR"
LOG_FILE="$LOGS_DIR/frontend-$(date '+%Y-%m-%d_%H-%M-%S').log"

info "Log: $LOG_FILE"
echo ""
echo "------------------------------------------------------------"
echo " Puerto : 5173"
echo " URL    : http://localhost:5173"
echo " Backend: http://localhost:8000/api"
echo "------------------------------------------------------------"
echo ""
echo "Presiona Ctrl+C para detener el servidor."
echo ""

cd "$FRONTEND_DIR"
npm run dev 2>&1 | tee "$LOG_FILE"
