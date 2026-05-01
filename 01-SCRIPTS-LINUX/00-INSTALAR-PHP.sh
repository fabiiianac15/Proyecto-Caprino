#!/usr/bin/env bash
# ============================================================================
# 00-INSTALAR-PHP.sh
# Instala PHP 8.2 con las extensiones necesarias para el proyecto
# Soporta: Ubuntu/Debian, Fedora/RHEL/CentOS, Arch Linux
# Uso: bash 00-INSTALAR-PHP.sh
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
echo -e "${CYAN}   INSTALAR PHP 8.2${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""

# Detectar si ya esta instalado
if command -v php &>/dev/null; then
    PHP_MAJOR=$(php -r "echo PHP_MAJOR_VERSION;")
    if [ "$PHP_MAJOR" -ge 8 ]; then
        ok "PHP ya instalado: $(php -v | head -1)"
        echo ""
        echo "Nada que hacer."
        exit 0
    fi
fi

# Detectar distro
detect_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo "${ID:-unknown}"
    elif command -v lsb_release &>/dev/null; then
        lsb_release -si | tr '[:upper:]' '[:lower:]'
    else
        echo "unknown"
    fi
}

DISTRO=$(detect_distro)
info "Distro detectada: $DISTRO"
echo ""

PHP_EXTENSIONS="php8.2 php8.2-cli php8.2-common php8.2-mbstring php8.2-xml php8.2-curl php8.2-zip php8.2-intl php8.2-sodium"

case "$DISTRO" in
    ubuntu|debian|linuxmint|pop)
        echo -e "${AMARILLO}Instalando PHP 8.2 via apt (Ubuntu/Debian)...${NC}"
        echo ""

        # Agregar repositorio de Ondrej Sury si no existe
        if ! apt-cache show php8.2 &>/dev/null 2>&1; then
            info "Agregando PPA ondrej/php..."
            sudo apt-get update -qq
            sudo apt-get install -y software-properties-common
            sudo add-apt-repository -y ppa:ondrej/php
        fi

        sudo apt-get update -qq
        sudo apt-get install -y $PHP_EXTENSIONS php8.2-dev

        ok "PHP 8.2 instalado"
        ;;

    fedora|rhel|centos|rocky|almalinux)
        echo -e "${AMARILLO}Instalando PHP 8.2 via dnf (Fedora/RHEL)...${NC}"
        echo ""

        if ! dnf list available php8.2 &>/dev/null 2>&1; then
            info "Habilitando repositorio Remi para PHP 8.2..."
            sudo dnf install -y https://rpms.remirepo.net/fedora/remi-release-$(rpm -E %fedora).rpm 2>/dev/null || \
            sudo dnf install -y https://rpms.remirepo.net/enterprise/remi-release-$(rpm -E %rhel).rpm 2>/dev/null || true
            sudo dnf module reset php -y
            sudo dnf module enable php:remi-8.2 -y
        fi

        sudo dnf install -y php php-cli php-common php-mbstring php-xml php-curl php-zip php-intl php-sodium php-devel

        ok "PHP 8.2 instalado"
        ;;

    arch|manjaro|endeavouros|garuda)
        echo -e "${AMARILLO}Instalando PHP 8.2 via pacman (Arch Linux)...${NC}"
        echo ""
        # Arch trae PHP 8.x por defecto en los repositorios oficiales
        sudo pacman -S --noconfirm php php-cgi

        ok "PHP instalado"
        ;;

    *)
        warn "Distro '$DISTRO' no reconocida."
        echo ""
        echo "Instala PHP 8.2 manualmente con el gestor de paquetes de tu distro."
        echo "Extensiones requeridas: mbstring, xml, curl, zip, intl, sodium, oci8"
        echo ""
        echo "Ejemplos:"
        echo "  Ubuntu/Debian : sudo apt install php8.2 php8.2-cli php8.2-mbstring ..."
        echo "  Fedora/RHEL   : sudo dnf install php php-cli php-mbstring ..."
        echo "  Arch Linux    : sudo pacman -S php"
        exit 1
        ;;
esac

echo ""

# Verificar
if command -v php &>/dev/null; then
    ok "PHP verificado: $(php -v | head -1)"
else
    error "PHP no encontrado despues de la instalacion. Revisa los errores anteriores."
fi

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${VERDE}   PHP INSTALADO${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""
echo "Siguiente paso: bash 02-INSTALAR-INSTANT-CLIENT.sh"
echo ""
