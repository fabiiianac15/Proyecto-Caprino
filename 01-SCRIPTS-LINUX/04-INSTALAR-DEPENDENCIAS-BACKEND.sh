#!/usr/bin/env bash
# ============================================================================
# 04-INSTALAR-DEPENDENCIAS-BACKEND.sh
# Instala dependencias PHP del backend con Composer
# Uso: bash 04-INSTALAR-DEPENDENCIAS-BACKEND.sh
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
BACKEND_DIR="$PROJECT_ROOT/backend-symfony"

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}   INSTALAR DEPENDENCIAS BACKEND${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""
info "Backend: $BACKEND_DIR"
echo ""

if [ ! -d "$BACKEND_DIR" ]; then
    error "Directorio backend no encontrado: $BACKEND_DIR"
fi

# ── En Arch Linux: habilitar extensiones PHP que vienen comentadas ────────────
DISTRO=""
[ -f /etc/os-release ] && { . /etc/os-release; DISTRO="${ID:-}"; }

if [[ "$DISTRO" =~ ^(arch|manjaro|endeavouros|garuda)$ ]]; then
    PHP_INI="/etc/php/php.ini"
    if [ -f "$PHP_INI" ]; then
        info "Arch Linux detectado: habilitando extensiones PHP en $PHP_INI..."
        for EXT in iconv intl sodium; do
            if grep -q "^;extension=${EXT}$" "$PHP_INI"; then
                sudo sed -i "s/^;extension=${EXT}$/extension=${EXT}/" "$PHP_INI"
                ok "extension=$EXT habilitada"
            fi
        done
    fi
fi
echo ""

# ── Verificar Composer ────────────────────────────────────────────────────────
echo -e "${AMARILLO}Verificando Composer...${NC}"
if ! command -v composer &>/dev/null; then
    error "Composer no encontrado. Ejecuta primero: bash 03b-INSTALAR-COMPOSER.sh"
fi
ok "$(composer --version 2>/dev/null | head -1)"
echo ""

# ── Instalar dependencias ─────────────────────────────────────────────────────
echo -e "${AMARILLO}Instalando dependencias PHP (esto puede tardar varios minutos)...${NC}"
info "(OCI8 y otras extensiones se ignoran hasta que esten instaladas)"
echo ""

cd "$BACKEND_DIR"

# NO borrar composer.lock - el lock garantiza builds reproducibles
composer install \
    --ignore-platform-req=php \
    --ignore-platform-req=ext-oci8 \
    --ignore-platform-req=ext-sodium \
    --ignore-platform-req=ext-iconv

echo ""
ok "Dependencias instaladas exitosamente"

# ── Verificar autoload ────────────────────────────────────────────────────────
echo ""
echo -e "${AMARILLO}Verificando autoload...${NC}"
if [ -f "vendor/autoload.php" ]; then
    ok "vendor/autoload.php generado correctamente"
else
    warn "vendor/autoload.php no encontrado - verifica errores de Composer"
fi

cd - > /dev/null

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${VERDE}   DEPENDENCIAS BACKEND INSTALADAS${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""
echo "Siguiente paso: bash 05-INSTALAR-DEPENDENCIAS-FRONTEND.sh"
echo ""
