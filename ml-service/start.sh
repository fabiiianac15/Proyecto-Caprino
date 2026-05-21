#!/bin/bash
# Arranca el microservicio ML en background
# Uso: bash start.sh [puerto]
# Por defecto puerto 8001

PUERTO=${1:-8001}
DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$DIR"

if [ ! -d "venv" ]; then
  echo "[ML] Creando entorno virtual..."
  python3 -m venv venv
  venv/bin/pip install --quiet -r requirements.txt
fi

echo "[ML] Iniciando microservicio en puerto $PUERTO..."
venv/bin/uvicorn main:app --host 0.0.0.0 --port "$PUERTO" --workers 1
