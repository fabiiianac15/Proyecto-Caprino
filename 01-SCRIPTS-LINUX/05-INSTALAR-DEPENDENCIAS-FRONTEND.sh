#!/usr/bin/env bash
# ============================================================================
# 05-INSTALAR-DEPENDENCIAS-FRONTEND.sh
# Instala dependencias Node.js del frontend con npm
# Uso: bash 05-INSTALAR-DEPENDENCIAS-FRONTEND.sh
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
echo -e "${CYAN}   INSTALAR DEPENDENCIAS FRONTEND${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""
info "Frontend: $FRONTEND_DIR"
echo ""

if [ ! -d "$FRONTEND_DIR" ]; then
    error "Directorio frontend no encontrado: $FRONTEND_DIR"
fi

# Cargar nvm si esta disponible
NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" || true

# ── Verificar Node.js y npm ───────────────────────────────────────────────────
echo -e "${AMARILLO}Verificando Node.js y npm...${NC}"

if ! command -v node &>/dev/null; then
    error "Node.js no encontrado. Ejecuta primero: bash 00-INSTALAR-NODE.sh"
fi
if ! command -v npm &>/dev/null; then
    error "npm no encontrado. Ejecuta primero: bash 00-INSTALAR-NODE.sh"
fi

NODE_VER=$(node --version)
NPM_VER=$(npm --version)
NODE_MAJOR=$(echo "$NODE_VER" | tr -d 'v' | cut -d. -f1)

ok "Node.js $NODE_VER / npm $NPM_VER"

if [ "$NODE_MAJOR" -lt 18 ]; then
    warn "Node.js $NODE_VER es menor a v18 - pueden ocurrir errores con Vite"
fi
echo ""

# ── Instalar dependencias ─────────────────────────────────────────────────────
cd "$FRONTEND_DIR"

echo -e "${AMARILLO}Instalando dependencias npm (esto puede tardar varios minutos)...${NC}"
echo ""

# NO borrar package-lock.json - el lock garantiza builds reproducibles
npm install

echo ""
ok "Dependencias instaladas exitosamente"

# ── Verificar Vite ────────────────────────────────────────────────────────────
echo ""
echo -e "${AMARILLO}Verificando Vite...${NC}"
if [ -f "node_modules/.bin/vite" ]; then
    ok "Vite disponible en node_modules/.bin/vite"
else
    warn "Vite no encontrado - verifica que esta en las dependencias del package.json"
fi

cd - > /dev/null

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${VERDE}   DEPENDENCIAS FRONTEND INSTALADAS${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""
echo "Siguiente paso: bash 09-CONFIGURAR-ENV.sh"
echo ""
