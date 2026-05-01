#!/usr/bin/env bash
# ============================================================================
# 00-INSTALACION-COMPLETA.sh
# Script maestro - ejecuta todos los pasos de instalacion en orden
# Uso: bash 00-INSTALACION-COMPLETA.sh
# ============================================================================

set -euo pipefail

VERDE='\033[0;32m'
AMARILLO='\033[1;33m'
ROJO='\033[0;31m'
CYAN='\033[0;36m'
GRIS='\033[0;37m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}   INSTALACION COMPLETA - PROYECTO CAPRINO${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""
echo -e "${AMARILLO}Este script instalara y configurara todo lo necesario para${NC}"
echo -e "${AMARILLO}conectarse a Oracle Autonomous Database en la nube.${NC}"
echo -e "${AMARILLO}Duracion estimada: 10-20 minutos segun la velocidad de internet.${NC}"
echo ""
echo -e "${CYAN}PREREQUISITO: Tener el wallet de Oracle Autonomous DB descargado${NC}"
echo -e "${GRIS}  Oracle Cloud Console -> ADB -> DB Connection -> Download Wallet${NC}"
echo -e "${GRIS}  Extraer el ZIP en: ~/caprino-wallet${NC}"
echo ""
echo -e "${GRIS}Directorio scripts : $SCRIPT_DIR${NC}"
echo -e "${GRIS}Directorio proyecto: $PROJECT_ROOT${NC}"
echo ""

# Lista de pasos en orden
declare -a PASO_IDS=("00-PHP" "00-NODE" "02-IC" "02-ENV" "02b-BD" "03-OCI8" "03b-COMP" "04-BACK" "05-FRONT" "09-DOTENV" "01-VERIF")
declare -A PASO_NOMBRES=(
    ["00-PHP"]="Instalar PHP 8.2"
    ["00-NODE"]="Instalar Node.js (via nvm)"
    ["02-IC"]="Instalar Oracle Instant Client"
    ["02-ENV"]="Configurar wallet Oracle Autonomous DB"
    ["02b-BD"]="Crear usuario y tablas en Oracle ADB"
    ["03-OCI8"]="Instalar extension OCI8 para PHP"
    ["03b-COMP"]="Instalar Composer"
    ["04-BACK"]="Instalar dependencias backend"
    ["05-FRONT"]="Instalar dependencias frontend"
    ["09-DOTENV"]="Configurar archivos .env"
    ["01-VERIF"]="Verificar requisitos (comprobacion final)"
)
declare -A PASO_ARCHIVOS=(
    ["00-PHP"]="00-INSTALAR-PHP.sh"
    ["00-NODE"]="00-INSTALAR-NODE.sh"
    ["02-IC"]="02-INSTALAR-INSTANT-CLIENT.sh"
    ["02-ENV"]="02-CONFIGURAR-ORACLE-ENV.sh"
    ["02b-BD"]="02b-CREAR-USUARIO-ORACLE.sh"
    ["03-OCI8"]="03-INSTALAR-OCI8.sh"
    ["03b-COMP"]="03b-INSTALAR-COMPOSER.sh"
    ["04-BACK"]="04-INSTALAR-DEPENDENCIAS-BACKEND.sh"
    ["05-FRONT"]="05-INSTALAR-DEPENDENCIAS-FRONTEND.sh"
    ["09-DOTENV"]="09-CONFIGURAR-ENV.sh"
    ["01-VERIF"]="01-VERIFICAR-REQUISITOS.sh"
)

echo "Pasos a ejecutar:"
for id in "${PASO_IDS[@]}"; do
    echo "  [$id] ${PASO_NOMBRES[$id]}"
done
echo ""

read -rp "Continuar? (s/n): " RESP
if [[ ! "$RESP" =~ ^[sS]$ ]]; then
    echo "Instalacion cancelada."
    exit 0
fi
echo ""

OK=0
FALLOS=0

for id in "${PASO_IDS[@]}"; do
    ARCHIVO="${PASO_ARCHIVOS[$id]}"
    NOMBRE="${PASO_NOMBRES[$id]}"
    RUTA="$SCRIPT_DIR/$ARCHIVO"

    echo "------------------------------------------------------------"
    echo -e "${CYAN}Paso [$id] $NOMBRE${NC}"
    echo "------------------------------------------------------------"

    if [ ! -f "$RUTA" ]; then
        echo -e "${AMARILLO}[AVISO] Script no encontrado: $ARCHIVO - saltando${NC}"
        continue
    fi

    if bash "$RUTA"; then
        echo -e "${VERDE}[OK] Paso completado${NC}"
        OK=$((OK + 1))
    else
        echo -e "${ROJO}[ERROR] El script termino con errores${NC}"
        FALLOS=$((FALLOS + 1))
        read -rp "Continuar con el siguiente paso? (s/n): " CONT
        if [[ ! "$CONT" =~ ^[sS]$ ]]; then
            echo -e "${ROJO}Instalacion cancelada por el usuario.${NC}"
            exit 1
        fi
    fi

    echo ""
done

echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}   INSTALACION FINALIZADA${NC}"
if [ "$FALLOS" -eq 0 ]; then
    echo -e "${VERDE}   Pasos exitosos: $OK   Fallos: $FALLOS${NC}"
else
    echo -e "${AMARILLO}   Pasos exitosos: $OK   Fallos: $FALLOS${NC}"
fi
echo -e "${CYAN}============================================================${NC}"
echo ""
echo -e "${CYAN}Para iniciar el sistema:${NC}"
echo "  1. Abrir terminal 1 -> bash 07-INICIAR-BACKEND.sh"
echo "  2. Abrir terminal 2 -> bash 08-INICIAR-FRONTEND.sh"
echo ""
echo -e "${VERDE}La aplicacion estara disponible en: http://localhost:5173${NC}"
echo -e "${GRIS}(con el backend corriendo en:        http://localhost:8000)${NC}"
echo ""
