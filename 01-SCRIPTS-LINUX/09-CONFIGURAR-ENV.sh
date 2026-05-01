#!/usr/bin/env bash
# ============================================================================
# 09-CONFIGURAR-ENV.sh
# Configura los archivos .env para backend y frontend
# Uso: bash 09-CONFIGURAR-ENV.sh
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

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}   CONFIGURAR ARCHIVOS .env${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""

# ── Leer configuracion Oracle del entorno ─────────────────────────────────────
# ~/.bashrc tiene guardia de shell interactivo, usar ~/.oracle_env directamente
[ -f "$HOME/.oracle_env" ] && source "$HOME/.oracle_env" || true

TNS_ADMIN_VAL="${TNS_ADMIN:-}"
TNS_NAME=""

if [ -n "$TNS_ADMIN_VAL" ] && [ -f "$TNS_ADMIN_VAL/tnsnames.ora" ]; then
    TNS_NAMES=$(grep -E "^\w.*=\s*\(" "$TNS_ADMIN_VAL/tnsnames.ora" 2>/dev/null | cut -d= -f1 | tr -d ' ' || true)
    # Preferir el alias _high; si no existe tomar el primero disponible
    TNS_NAME=$(echo "$TNS_NAMES" | grep "_high$" | head -1 || true)
    [ -z "$TNS_NAME" ] && TNS_NAME=$(echo "$TNS_NAMES" | head -1 || true)
fi

# ── Backend .env ──────────────────────────────────────────────────────────────
echo -e "${AMARILLO}Configurando backend/.env...${NC}"

BACKEND_ENV="$PROJECT_ROOT/backend-symfony/.env"
if [ ! -f "$BACKEND_ENV" ]; then
    error "backend/.env no encontrado: $BACKEND_ENV"
fi

# Generar secrets con openssl (evita el problema SIGPIPE de tr+head con pipefail)
gen_secret() { openssl rand -hex "$1"; }

# Generar APP_SECRET aleatorio si tiene el valor por defecto
if grep -q "APP_SECRET=cambiar_este_secreto" "$BACKEND_ENV"; then
    APP_SECRET=$(gen_secret 16)   # 16 bytes = 32 caracteres hex
    sed -i "s|^APP_SECRET=.*|APP_SECRET=${APP_SECRET}|" "$BACKEND_ENV"
    ok "APP_SECRET generado aleatoriamente"
fi

# Generar JWT_SECRET
JWT_SECRET=$(gen_secret 24)       # 24 bytes = 48 caracteres hex
if grep -q "^JWT_SECRET=" "$BACKEND_ENV"; then
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" "$BACKEND_ENV"
else
    printf '\nJWT_SECRET=%s\n' "$JWT_SECRET" >> "$BACKEND_ENV"
fi
ok "JWT_SECRET generado aleatoriamente"

# Actualizar TNS_ADMIN y TNS_NAME si se detectaron
if [ -n "$TNS_ADMIN_VAL" ]; then
    sed -i "s|^DATABASE_WALLET_PATH=.*|DATABASE_WALLET_PATH=${TNS_ADMIN_VAL}|" "$BACKEND_ENV"
    ok "DATABASE_WALLET_PATH = $TNS_ADMIN_VAL"
fi
if [ -n "$TNS_NAME" ]; then
    sed -i "s|^DATABASE_TNS_NAME=.*|DATABASE_TNS_NAME=${TNS_NAME}|" "$BACKEND_ENV"
    ok "DATABASE_TNS_NAME = $TNS_NAME"
fi

ok "backend/.env configurado"
echo ""

# ── Frontend .env.local ───────────────────────────────────────────────────────
echo -e "${AMARILLO}Configurando frontend/.env.local...${NC}"

FRONTEND_ENV="$PROJECT_ROOT/frontend-web/.env.local"
cat > "$FRONTEND_ENV" <<'EOF'
# Configuracion local de la maquina (sobreescribe frontend-web/.env)
# Este archivo es ignorado por git
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Sistema Caprino
EOF

ok "frontend/.env.local configurado"

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${VERDE}   CONFIGURACION COMPLETADA${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""
echo -e "${CYAN}Archivos configurados:${NC}"
info "  Backend : $BACKEND_ENV"
info "  Frontend: $FRONTEND_ENV"
echo ""
if [ -n "${TNS_NAME:-}" ]; then
    echo -e "${CYAN}Oracle Autonomous DB:${NC}"
    info "  TNS alias: $TNS_NAME"
    info "  Wallet   : $TNS_ADMIN_VAL"
    echo ""
fi
echo -e "${CYAN}Credenciales de la base de datos:${NC}"
info "  Usuario  : caprino_user"
info "  Password : (la configurada en 02b-CREAR-USUARIO-ORACLE.sh)"
echo ""
