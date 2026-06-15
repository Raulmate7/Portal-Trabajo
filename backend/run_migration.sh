#!/bin/bash
# Ir al directorio donde reside este script
cd "$(dirname "$0")"

# Archivo de log local
LOG_FILE="migration_log.txt"

echo "=== INICIANDO PROCESO DE MIGRACIÓN ===" > "$LOG_FILE"
echo "Fecha y hora: $(date)" >> "$LOG_FILE"
echo "Directorio de ejecución: $(pwd)" >> "$LOG_FILE"

# 1. Comprobar intérpretes de Python
echo "🔍 Comprobando versión de Python disponible..." >> "$LOG_FILE"
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Error: No se encontró comando 'python3' ni 'python' en el servidor." >> "$LOG_FILE"
    exit 1
fi
$PYTHON_CMD --version >> "$LOG_FILE" 2>&1

# 2. Crear entorno virtual si no existe
if [ ! -d "venv" ]; then
    echo "📦 Creando entorno virtual (venv)..." >> "$LOG_FILE"
    $PYTHON_CMD -m venv venv >> "$LOG_FILE" 2>&1
    if [ $? -ne 0 ]; then
        echo "⚠️ Advertencia: Falló 'venv'. Intentando con 'virtualenv'..." >> "$LOG_FILE"
        virtualenv venv >> "$LOG_FILE" 2>&1
    fi
fi

# 3. Instalar librerías necesarias en el venv
echo "📥 Instalando pip y paquetes requeridos (pymysql, cryptography, psycopg2-binary, dotenv)..." >> "$LOG_FILE"
venv/bin/pip install --upgrade pip >> "$LOG_FILE" 2>&1
venv/bin/pip install pymysql cryptography psycopg2-binary python-dotenv >> "$LOG_FILE" 2>&1

# 4. Ejecutar el script de migración
echo "🚀 Ejecutando script migrate_to_mysql.py..." >> "$LOG_FILE"
venv/bin/python migrate_to_mysql.py >> "$LOG_FILE" 2>&1

echo "=== PROCESO DE MIGRACIÓN FINALIZADO ===" >> "$LOG_FILE"
