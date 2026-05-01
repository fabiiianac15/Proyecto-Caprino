#!/usr/bin/env bash
# ============================================================================
# 00-INSTALAR-NODE.sh
# Instala Node.js 20 LTS via nvm (Node Version Manager)
# nvm es el metodo mas portable para instalar Node en Linux sin sudo
# Uso: bash 00-INSTALAR-NODE.sh
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
echo -e "${CYAN}   INSTALAR NODE.JS 20 LTS${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""

# Verificar si ya esta instalado
if command -v node &>/dev/null; then
    NODE_MAJOR=$(node --version | tr -d 'v' | cut -d. -f1)
    if [ "$NODE_MAJOR" -ge 18 ]; then
        ok "Node.js ya instalado: $(node --version) / npm $(npm --version)"
        exit 0
    fi
fi

NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

# Instalar nvm si no existe
if [ ! -f "$NVM_DIR/nvm.sh" ]; then
    echo -e "${AMARILLO}Instalando nvm (Node Version Manager)...${NC}"
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    ok "nvm instalado"
else
    ok "nvm ya instalado en $NVM_DIR"
fi

# Cargar nvm en la sesion actual
export NVM_DIR
# shellcheck source=/dev/null
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo ""
echo -e "${AMARILLO}Instalando Node.js 20 LTS...${NC}"
nvm install 20
nvm use 20
nvm alias default 20

echo ""

# Verificar
if command -v node &>/dev/null; then
    ok "Node.js $(node --version) / npm $(npm --version)"
else
    error "node no encontrado despues de la instalacion"
fi

# Agregar nvm al perfil del shell si no esta ya
PROFILE_FILES=("$HOME/.bashrc" "$HOME/.bash_profile" "$HOME/.zshrc")
NVM_INIT_LINE='[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"'

for pf in "${PROFILE_FILES[@]}"; do
    if [ -f "$pf" ] && ! grep -q "nvm.sh" "$pf"; then
        cat >> "$pf" <<'EOF'

# nvm - Node Version Manager
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
EOF
        info "  nvm agregado a $pf"
    fi
done

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${VERDE}   NODE.JS INSTALADO${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""
echo "IMPORTANTE: Abre una nueva terminal (o ejecuta: source ~/.bashrc)"
echo "para que nvm este disponible en futuras sesiones."
echo ""
echo "Siguiente paso: bash 02-INSTALAR-INSTANT-CLIENT.sh"
echo ""
