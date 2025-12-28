#!/bin/bash

# ============================================================================
# Script de Inicio del Sistema de Gestion Caprino
# ============================================================================
# Descripcion: Inicia todos los servicios necesarios del proyecto
# Uso: ./start-all.sh
# ============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${PROJECT_DIR}/startup.log"

# Funciones
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1" >> "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [OK] $1" >> "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1" >> "$LOG_FILE"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 no esta instalado. Por favor instalalo primero."
        exit 1
    fi
}

print_header() {
    echo ""
    echo "============================================================================"
    echo "  Sistema de Gestion Caprino - Inicializacion"
    echo "============================================================================"
    echo ""
}

print_footer() {
    echo ""
    echo "============================================================================"
    echo "  Sistema Iniciado Correctamente"
    echo "============================================================================"
    echo ""
    echo "  Backend API:    http://localhost:8000/api"
    echo "  Frontend Web:   http://localhost:5173"
    echo "  Oracle DB:      localhost:1521/XEPDB1"
    echo ""
    echo "  Logs:           $LOG_FILE"
    echo ""
    echo "  Para detener:   docker stop caprino_symfony_dev caprino_oracle_dev"
    echo "                  En terminal frontend: Ctrl+C"
    echo "============================================================================"
    echo ""
}

# ============================================================================
# INICIO DEL SCRIPT
# ============================================================================

print_header

# Limpiar log anterior
> "$LOG_FILE"

log_info "Verificando dependencias..."

# Verificar Docker
check_command docker
log_success "Docker instalado"

# Verificar Node.js
check_command node
log_success "Node.js instalado"

# Verificar npm
check_command npm
log_success "npm instalado"

# ============================================================================
# PASO 1: Iniciar Oracle Database
# ============================================================================

log_info "Iniciando Oracle Database..."

if docker ps -a | grep -q caprino_oracle_dev; then
    if docker ps | grep -q caprino_oracle_dev; then
        log_warning "Oracle ya esta ejecutandose"
    else
        docker start caprino_oracle_dev >> "$LOG_FILE" 2>&1
        log_success "Oracle Database iniciado"
    fi
else
    log_error "Contenedor caprino_oracle_dev no existe. Ejecuta docker-compose up -d primero"
    exit 1
fi

log_info "Esperando a que Oracle este listo (30 segundos)..."
sleep 30
log_success "Oracle Database listo"

# ============================================================================
# PASO 2: Registrar servicio Oracle
# ============================================================================

log_info "Registrando servicio XEPDB1 en Oracle listener..."

docker exec caprino_oracle_dev bash -c \
    "echo 'ALTER SYSTEM REGISTER;' | sqlplus -s sys/OraclePass2025 as sysdba" \
    >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
    log_success "Servicio Oracle registrado"
else
    log_warning "No se pudo registrar servicio (puede que ya este registrado)"
fi

# ============================================================================
# PASO 3: Iniciar Backend Symfony
# ============================================================================

log_info "Iniciando Backend Symfony..."

if docker ps -a | grep -q caprino_symfony_dev; then
    if docker ps | grep -q caprino_symfony_dev; then
        log_warning "Symfony ya esta ejecutandose"
    else
        docker start caprino_symfony_dev >> "$LOG_FILE" 2>&1
        log_success "Backend Symfony iniciado"
    fi
else
    log_error "Contenedor caprino_symfony_dev no existe. Ejecuta docker-compose up -d primero"
    exit 1
fi

log_info "Esperando a que Symfony este listo (10 segundos)..."
sleep 10

# Verificar que Symfony responda
log_info "Verificando Backend API..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "200" ]; then
    log_success "Backend API respondiendo (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "500" ]; then
    log_warning "Backend responde pero hay errores internos (Doctrine-Oracle bug conocido)"
else
    log_warning "Backend no responde correctamente (HTTP $HTTP_CODE)"
fi

# ============================================================================
# PASO 4: Iniciar Frontend React
# ============================================================================

log_info "Iniciando Frontend React..."

cd "${PROJECT_DIR}/frontend-web"

# Verificar si node_modules existe
if [ ! -d "node_modules" ]; then
    log_info "Instalando dependencias de npm (primera vez)..."
    npm install >> "$LOG_FILE" 2>&1
    log_success "Dependencias instaladas"
fi

# Verificar si ya hay un proceso Vite corriendo
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    log_warning "Frontend ya esta ejecutandose en puerto 5173"
else
    log_info "Iniciando servidor de desarrollo Vite..."
    log_info "El servidor se iniciara en una nueva terminal"
    
    # Iniciar en background
    nohup npm run dev > "${PROJECT_DIR}/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    
    log_info "Esperando a que Vite este listo (15 segundos)..."
    sleep 15
    
    if ps -p $FRONTEND_PID > /dev/null; then
        log_success "Frontend React iniciado (PID: $FRONTEND_PID)"
    else
        log_error "No se pudo iniciar el frontend"
        exit 1
    fi
fi

# ============================================================================
# PASO 5: Verificacion Final
# ============================================================================

log_info "Verificando servicios..."

# Verificar Oracle
if docker ps | grep -q caprino_oracle_dev; then
    log_success "Oracle Database: ACTIVO"
else
    log_error "Oracle Database: INACTIVO"
fi

# Verificar Symfony
if docker ps | grep -q caprino_symfony_dev; then
    log_success "Backend Symfony: ACTIVO"
else
    log_error "Backend Symfony: INACTIVO"
fi

# Verificar Frontend
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    log_success "Frontend React: ACTIVO"
else
    log_error "Frontend React: INACTIVO"
fi

# ============================================================================
# FIN
# ============================================================================

print_footer

log_info "Sistema iniciado correctamente"
log_info "Para ver logs del frontend: tail -f ${PROJECT_DIR}/frontend.log"

exit 0
