#!/usr/bin/env bash
# ============================================================================
# 03-INSTALAR-OCI8.sh
# Instala y habilita la extension OCI8 para PHP en Linux
# Estrategia: phpize + compilacion manual (funciona en todas las distros,
#             incluyendo Arch donde php-pear no esta en repos oficiales)
# Requiere: PHP instalado + Oracle Instant Client instalado
# Uso: bash 03-INSTALAR-OCI8.sh
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

IC_DIR="/opt/oracle/instantclient_21_14"
OCI8_VERSION="3.3.0"

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}   INSTALAR EXTENSION OCI8 PARA PHP${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""

# Cargar variables de Oracle
[ -f "$HOME/.oracle_env" ] && source "$HOME/.oracle_env" || true
export LD_LIBRARY_PATH="${IC_DIR}${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
export PATH="$PATH:$IC_DIR"

# ── Verificar PHP ─────────────────────────────────────────────────────────────
if ! command -v php &>/dev/null; then
    error "PHP no encontrado. Ejecuta primero: bash 00-INSTALAR-PHP.sh"
fi
PHP_VER=$(php -r "echo PHP_VERSION;")
ok "PHP encontrado: $PHP_VER"

# ── Verificar si OCI8 ya esta cargado ────────────────────────────────────────
if php -m 2>/dev/null | grep -q "^oci8$"; then
    ok "OCI8 ya esta cargado en PHP - no es necesario reinstalar"
    exit 0
fi

# ── Verificar Oracle Instant Client ──────────────────────────────────────────
echo ""
echo -e "${AMARILLO}Verificando Oracle Instant Client...${NC}"
if ls "${IC_DIR}"/libclntsh.so* &>/dev/null 2>&1; then
    ok "Instant Client encontrado en $IC_DIR"
elif ldconfig -p 2>/dev/null | grep -q "libclntsh"; then
    ok "libclntsh encontrada via ldconfig"
    IC_DIR=$(ldconfig -p | grep "libclntsh" | head -1 | awk '{print $NF}' | xargs dirname || echo "$IC_DIR")
else
    error "Oracle Instant Client no encontrado. Ejecuta: bash 02-INSTALAR-INSTANT-CLIENT.sh"
fi

# ── Instalar dependencias de compilacion ──────────────────────────────────────
echo ""
echo -e "${AMARILLO}Verificando dependencias de compilacion...${NC}"

DISTRO=""
[ -f /etc/os-release ] && { . /etc/os-release; DISTRO="${ID:-}"; }

case "$DISTRO" in
    ubuntu|debian|linuxmint|pop)
        PHP_MAJ_MIN=$(php -r "echo PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION;")
        sudo apt-get update -qq
        sudo apt-get install -y "php${PHP_MAJ_MIN}-dev" build-essential libaio1 libaio-dev 2>/dev/null || \
        sudo apt-get install -y php-dev build-essential libaio1
        ;;
    fedora|rhel|centos|rocky|almalinux)
        sudo dnf install -y php-devel gcc make libaio libaio-devel
        ;;
    arch|manjaro|endeavouros|garuda)
        # En Arch, phpize viene incluido en el paquete 'php'
        # php-pear NO esta en repos oficiales; compilamos directamente con phpize
        sudo pacman -S --noconfirm --needed gcc make
        ;;
    *)
        warn "Distro '$DISTRO' no reconocida. Asegurate de tener gcc, make y php-dev instalados."
        ;;
esac

# Verificar phpize (necesario para compilar extensiones PHP)
if ! command -v phpize &>/dev/null; then
    error "phpize no encontrado.
  Ubuntu/Debian : sudo apt install php-dev
  Fedora/RHEL   : sudo dnf install php-devel
  Arch Linux    : sudo pacman -S php  (phpize viene incluido)"
fi
ok "phpize disponible: $(phpize --version 2>/dev/null | head -1 || echo 'ok')"

# ── Descargar y compilar OCI8 desde el tarball de PECL ───────────────────────
echo ""
echo -e "${AMARILLO}Descargando OCI8 ${OCI8_VERSION} desde PECL...${NC}"
info "(Esto puede tardar varios minutos mientras compila)"
echo ""

TMP_DIR=$(mktemp -d /tmp/oci8_build_XXXXXX)
trap 'rm -rf "$TMP_DIR"' EXIT

OCI8_URL="https://pecl.php.net/get/oci8-${OCI8_VERSION}.tgz"
OCI8_TGZ="$TMP_DIR/oci8.tgz"

if ! curl -fsSL --retry 3 -o "$OCI8_TGZ" "$OCI8_URL"; then
    # Intentar version anterior si la principal falla
    OCI8_VERSION="3.2.1"
    OCI8_URL="https://pecl.php.net/get/oci8-${OCI8_VERSION}.tgz"
    curl -fsSL --retry 3 -o "$OCI8_TGZ" "$OCI8_URL" || \
        error "No se pudo descargar OCI8 desde PECL. Verifica tu conexion a internet."
fi
ok "Descargado oci8-${OCI8_VERSION}.tgz"

echo ""
info "Extrayendo fuentes..."
tar xzf "$OCI8_TGZ" -C "$TMP_DIR"
OCI8_SRC=$(find "$TMP_DIR" -maxdepth 1 -mindepth 1 -type d -name "oci8*" | head -1)
[ -z "$OCI8_SRC" ] && error "No se encontro el directorio de fuentes de OCI8 tras extraer el tarball"

cd "$OCI8_SRC"

info "Ejecutando phpize..."
phpize

info "Configurando con Instant Client en $IC_DIR..."
./configure --with-oci8=instantclient,"$IC_DIR"

info "Compilando (make)..."
make -j"$(nproc)"

info "Instalando extension..."
sudo make install

ok "OCI8 compilado e instalado"
cd - > /dev/null

# ── Habilitar en php.ini ──────────────────────────────────────────────────────
echo ""
echo -e "${AMARILLO}Configurando php.ini...${NC}"

PHP_INI_DIR=$(php --ini 2>/dev/null | grep "Scan for additional" | awk -F': ' '{print $2}' | xargs || true)
PHP_INI_MAIN=$(php --ini 2>/dev/null | grep "Loaded Configuration File" | awk -F': ' '{print $2}' | xargs || true)

if [ -n "$PHP_INI_DIR" ] && [ -d "$PHP_INI_DIR" ]; then
    OCI8_INI="$PHP_INI_DIR/20-oci8.ini"
    echo "extension=oci8" | sudo tee "$OCI8_INI" > /dev/null
    ok "Extension configurada en $OCI8_INI"
elif [ -n "$PHP_INI_MAIN" ] && [ -f "$PHP_INI_MAIN" ]; then
    if ! grep -q "^extension=oci8" "$PHP_INI_MAIN"; then
        echo -e "\nextension=oci8" | sudo tee -a "$PHP_INI_MAIN" > /dev/null
    fi
    ok "Extension habilitada en $PHP_INI_MAIN"
else
    warn "No se pudo detectar php.ini automaticamente."
    warn "Agrega 'extension=oci8' a tu php.ini manualmente."
    warn "Ubicacion: $(php --ini 2>/dev/null | grep 'Configuration File' || echo 'desconocida')"
fi

# En algunas distros se necesita configurar LD_LIBRARY_PATH para Apache/PHP-FPM
if [ -f /etc/apache2/envvars ] && ! grep -q "instantclient" /etc/apache2/envvars; then
    echo "export LD_LIBRARY_PATH=${IC_DIR}\${LD_LIBRARY_PATH:+:\$LD_LIBRARY_PATH}" | sudo tee -a /etc/apache2/envvars > /dev/null
    ok "LD_LIBRARY_PATH agregado a /etc/apache2/envvars"
fi

echo ""

# ── Verificar ────────────────────────────────────────────────────────────────
echo -e "${AMARILLO}Verificando que OCI8 carga...${NC}"
if php -m 2>/dev/null | grep -q "^oci8$"; then
    ok "OCI8 cargado exitosamente"
else
    warn "OCI8 aun no aparece en 'php -m'."
    warn "Intenta abrir una nueva terminal y ejecutar: php -m | grep oci8"
    warn "Si usas PHP-FPM, reinicia: sudo systemctl restart php-fpm"
fi

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${VERDE}   OCI8 CONFIGURADO${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""
echo "Siguiente paso: bash 03b-INSTALAR-COMPOSER.sh"
echo ""
