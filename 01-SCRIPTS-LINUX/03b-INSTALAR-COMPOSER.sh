#!/usr/bin/env bash
# ============================================================================
# 03b-INSTALAR-COMPOSER.sh
# Instala Composer (gestor de dependencias PHP)
# Uso: bash 03b-INSTALAR-COMPOSER.sh
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

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}   INSTALAR COMPOSER${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""

# Verificar si ya esta instalado
if command -v composer &>/dev/null; then
    ok "Composer ya instalado: $(composer --version 2>/dev/null | head -1)"
    exit 0
fi

# Verificar PHP
if ! command -v php &>/dev/null; then
    error "PHP no encontrado. Ejecuta primero: bash 00-INSTALAR-PHP.sh"
fi

# Verificar curl
if ! command -v curl &>/dev/null; then
    error "curl no encontrado. Instala curl con tu gestor de paquetes."
fi

echo -e "${AMARILLO}Descargando Composer installer...${NC}"

TMP_COMPOSER="/tmp/composer-setup.php"
curl -fsSL https://getcomposer.org/installer -o "$TMP_COMPOSER"

# Verificar hash del installer
EXPECTED_HASH=$(curl -fsSL https://composer.github.io/installer.sig)
ACTUAL_HASH=$(php -r "echo hash_file('sha384', '$TMP_COMPOSER');")

if [ "$EXPECTED_HASH" != "$ACTUAL_HASH" ]; then
    rm -f "$TMP_COMPOSER"
    error "Hash del installer no coincide - descarga corrupta o comprometida"
fi
ok "Hash verificado"

echo ""
echo -e "${AMARILLO}Instalando Composer globalmente en /usr/local/bin/composer...${NC}"

sudo php "$TMP_COMPOSER" --install-dir=/usr/local/bin --filename=composer
rm -f "$TMP_COMPOSER"

echo ""

# Verificar
if command -v composer &>/dev/null; then
    ok "$(composer --version 2>/dev/null | head -1)"
else
    error "composer no encontrado despues de la instalacion"
fi

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${VERDE}   COMPOSER INSTALADO${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""
echo "Siguiente paso: bash 04-INSTALAR-DEPENDENCIAS-BACKEND.sh"
echo ""
