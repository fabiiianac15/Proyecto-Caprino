#!/bin/bash

# ============================================================================
# Script para Detener el Sistema de Gestion Caprino
# ============================================================================
# Descripcion: Detiene todos los servicios del proyecto
# Uso: ./stop-all.sh
# ============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

echo ""
echo "============================================================================"
echo "  Deteniendo Sistema de Gestion Caprino"
echo "============================================================================"
echo ""

# Detener Frontend
log_info "Deteniendo Frontend React..."
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    FRONTEND_PID=$(lsof -Pi :5173 -sTCP:LISTEN -t)
    kill $FRONTEND_PID 2>/dev/null || true
    log_success "Frontend detenido"
else
    log_info "Frontend no esta ejecutandose"
fi

# Detener Backend Symfony
log_info "Deteniendo Backend Symfony..."
if docker ps | grep -q caprino_symfony_dev; then
    docker stop caprino_symfony_dev > /dev/null 2>&1
    log_success "Backend Symfony detenido"
else
    log_info "Backend no esta ejecutandose"
fi

# Detener Oracle
log_info "Deteniendo Oracle Database..."
if docker ps | grep -q caprino_oracle_dev; then
    docker stop caprino_oracle_dev > /dev/null 2>&1
    log_success "Oracle Database detenido"
else
    log_info "Oracle no esta ejecutandose"
fi

echo ""
echo "============================================================================"
echo "  Sistema Detenido"
echo "============================================================================"
echo ""

exit 0
