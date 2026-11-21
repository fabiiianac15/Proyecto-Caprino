#!/usr/bin/env bash
# Sube el código Python del servicio de ML (sin venv ni modelo entrenado) y lo reinicia.
set -euo pipefail
source "$(dirname "$0")/_comun.sh"
rsync -az -e "ssh ${SSH_OPC[*]}" --exclude venv --exclude __pycache__ --exclude modelo_guardado \
  "$RAIZ/ml-service/" "$HOST:/var/www/caprino/ml-service/"
remoto 'sudo systemctl restart caprino-ml && sleep 4 && systemctl is-active caprino-ml && curl -s localhost:8001/ml/ia-health'
echo
