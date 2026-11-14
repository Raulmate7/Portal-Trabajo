#!/bin/bash
# ==============================================================================
# SCRIPT DE ENVÍO SEMANAL DE NEWSLETTER (PORTAL TRABAJO IT)
# ==============================================================================
# Cron recomendado en servidor (Lunes 08:00 UTC = 09:00 España invierno):
# 0 8 * * 1 /var/www/proyecto_empleo/scripts/send_weekly_email.sh >> /var/log/weekly_email.log 2>&1
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR}/../backend"
cd "$BACKEND_DIR"

PYTHON_BIN="venv/bin/python3"
if [ ! -x "$PYTHON_BIN" ]; then
    PYTHON_BIN="python3"
fi

echo "=========================================================="
echo "📧 [$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Iniciando envío semanal (mailer.py)..."
"$PYTHON_BIN" mailer.py
echo "✅ [$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Envío semanal finalizado."
echo "=========================================================="
