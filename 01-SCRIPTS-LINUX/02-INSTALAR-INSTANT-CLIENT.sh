#!/usr/bin/env bash
# ============================================================================
# 02-INSTALAR-INSTANT-CLIENT.sh
# Descarga e instala Oracle Instant Client 21.x para Linux x64
# Incluye: Basic (librerias OCI) + SQL*Plus (para conectarse al ADB por consola)
# Uso: bash 02-INSTALAR-INSTANT-CLIENT.sh
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

IC_VERSION="21.14.0.0.0"
IC_BUILD="2114000"
INSTALL_DIR="/opt/oracle/instantclient_21_14"
URL_BASE="https://download.oracle.com/otn_software/linux/instantclient/${IC_BUILD}"
URL_BASIC="${URL_BASE}/instantclient-basic-linux.x64-${IC_VERSION}dbru.zip"
URL_SQLPLUS="${URL_BASE}/instantclient-sqlplus-linux.x64-${IC_VERSION}dbru.zip"
URL_SDK="${URL_BASE}/instantclient-sdk-linux.x64-${IC_VERSION}dbru.zip"

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}   INSTALAR ORACLE INSTANT CLIENT 21.x (Linux)${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""
info "Oracle Instant Client permite a PHP/OCI8 y SQL*Plus conectarse"
info "a Oracle Autonomous DB. No instala ningun servicio local de BD."
echo ""

# Verificar si ya esta instalado
if ls "${INSTALL_DIR}"/libclntsh.so* &>/dev/null 2>&1; then
    ok "Oracle Instant Client ya instalado en: ${INSTALL_DIR}"
    # Asegurarse de que este en ld.so.conf
    if ! ldconfig -p 2>/dev/null | grep -q "libclntsh"; then
        echo "${INSTALL_DIR}" | sudo tee /etc/ld.so.conf.d/oracle-instantclient.conf > /dev/null
        sudo ldconfig
        ok "ldconfig actualizado"
    else
        ok "ldconfig ya configurado"
    fi
    exit 0
fi

# Verificar dependencias del sistema
echo -e "${AMARILLO}Verificando dependencias del sistema...${NC}"
FALTANTES=()
for cmd in curl unzip; do
    command -v "$cmd" &>/dev/null || FALTANTES+=("$cmd")
done

if [ ${#FALTANTES[@]} -gt 0 ]; then
    info "Instalando: ${FALTANTES[*]}"
    if command -v apt-get &>/dev/null; then
        sudo apt-get update -qq && sudo apt-get install -y "${FALTANTES[@]}" libaio1
    elif command -v dnf &>/dev/null; then
        sudo dnf install -y "${FALTANTES[@]}" libaio
    elif command -v pacman &>/dev/null; then
        sudo pacman -S --noconfirm "${FALTANTES[@]}"
    fi
fi

# libaio es necesaria en algunas distros para Instant Client
if ! ldconfig -p 2>/dev/null | grep -q libaio && ! ls /usr/lib*/libaio* &>/dev/null 2>&1; then
    warn "libaio no encontrada. Instalando..."
    if command -v apt-get &>/dev/null; then sudo apt-get install -y libaio1 || true
    elif command -v dnf &>/dev/null; then sudo dnf install -y libaio || true
    elif command -v pacman &>/dev/null; then sudo pacman -S --noconfirm libaio || true
    fi
fi

# Crear directorio de instalacion
echo ""
info "Directorio destino: ${INSTALL_DIR}"
sudo mkdir -p "${INSTALL_DIR}"

# Funcion para descargar y extraer
instalar_paquete() {
    local nombre="$1"
    local url="$2"
    local tmp_zip="/tmp/ic_${nombre}.zip"
    local tmp_dir="/tmp/ic_extract_${nombre}"

    echo -e "${AMARILLO}Descargando ${nombre}...${NC}"

    if ! curl -fsSL --retry 3 -o "$tmp_zip" "$url"; then
        warn "No se pudo descargar ${nombre} desde:"
        warn "  ${url}"
        return 1
    fi
    ok "Descargado"

    info "Extrayendo ${nombre}..."
    rm -rf "$tmp_dir"
    mkdir -p "$tmp_dir"
    unzip -q "$tmp_zip" -d "$tmp_dir"

    # Los archivos estan dentro de una subcarpeta instantclient_21_14
    SUBDIR=$(find "$tmp_dir" -maxdepth 1 -mindepth 1 -type d | head -1)
    if [ -n "$SUBDIR" ]; then
        sudo cp -a "$SUBDIR"/. "${INSTALL_DIR}/"
    else
        sudo cp -a "$tmp_dir"/. "${INSTALL_DIR}/"
    fi
    ok "Extraido en ${INSTALL_DIR}"

    rm -rf "$tmp_zip" "$tmp_dir"
    return 0
}

# Instalar paquetes
instalar_paquete "basic"   "$URL_BASIC"   || error "El paquete Basic es obligatorio. Descarga manual desde: https://www.oracle.com/database/technologies/instant-client/linux-x86-64-downloads.html"
instalar_paquete "sqlplus" "$URL_SQLPLUS" || warn "SQL*Plus no se instalo (opcional)"
instalar_paquete "sdk"     "$URL_SDK"     || warn "SDK no se instalo (necesario para compilar OCI8)"

echo ""

# Crear enlaces simbolicos que PHP necesita
echo -e "${AMARILLO}Creando enlaces simbolicos...${NC}"
cd "${INSTALL_DIR}"
if ls libclntsh.so.21* &>/dev/null 2>&1 && [ ! -e libclntsh.so ]; then
    sudo ln -sf libclntsh.so.21.1 libclntsh.so 2>/dev/null || true
    ok "Enlace libclntsh.so creado"
fi
if ls libocci.so.21* &>/dev/null 2>&1 && [ ! -e libocci.so ]; then
    sudo ln -sf libocci.so.21.1 libocci.so 2>/dev/null || true
fi
cd - > /dev/null

# Configurar ldconfig
echo ""
echo -e "${AMARILLO}Configurando ldconfig...${NC}"
echo "${INSTALL_DIR}" | sudo tee /etc/ld.so.conf.d/oracle-instantclient.conf > /dev/null
sudo ldconfig
ok "ldconfig actualizado"

# Agregar al PATH del usuario
SHELL_RC="$HOME/.bashrc"
[ -n "${ZSH_VERSION:-}" ] && SHELL_RC="$HOME/.zshrc"

if ! grep -q "instantclient" "$SHELL_RC" 2>/dev/null; then
    cat >> "$SHELL_RC" <<EOF

# Oracle Instant Client
export LD_LIBRARY_PATH=${INSTALL_DIR}\${LD_LIBRARY_PATH:+:\$LD_LIBRARY_PATH}
export PATH=\$PATH:${INSTALL_DIR}
EOF
    ok "Variables de entorno agregadas a $SHELL_RC"
fi

export LD_LIBRARY_PATH="${INSTALL_DIR}${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
export PATH="$PATH:${INSTALL_DIR}"

echo ""

# Verificar instalacion
echo -e "${AMARILLO}Verificando instalacion...${NC}"
if ls "${INSTALL_DIR}"/libclntsh.so* &>/dev/null 2>&1; then
    ok "libclntsh encontrada - Instant Client listo"
else
    error "libclntsh no encontrada en ${INSTALL_DIR}"
fi

if [ -f "${INSTALL_DIR}/sqlplus" ]; then
    ok "sqlplus instalado"
fi

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${VERDE}   ORACLE INSTANT CLIENT INSTALADO${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""
info "  Ruta    : ${INSTALL_DIR}"
info "  Version : ${IC_VERSION}"
echo ""
echo "IMPORTANTE: Abre una nueva terminal (o ejecuta: source ~/.bashrc)"
echo "para que los cambios de PATH y LD_LIBRARY_PATH surtan efecto."
echo ""
echo "Siguiente paso: bash 02-CONFIGURAR-ORACLE-ENV.sh"
echo ""
