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
# Comprobamos la existencia del ejecutable pip dentro del venv
if [ ! -f "venv/bin/pip" ]; then
    echo "📦 Creando entorno virtual (venv)..." >> "$LOG_FILE"
    rm -rf venv
    $PYTHON_CMD -m venv venv >> "$LOG_FILE" 2>&1
    
    # Fallback si venv no crea bin/pip (común en instalaciones reducidas de Python en CentOS)
    if [ ! -f "venv/bin/pip" ]; then
        echo "⚠️ Advertencia: 'venv' falló o no instaló pip. Intentando con 'virtualenv'..." >> "$LOG_FILE"
        rm -rf venv
        virtualenv venv >> "$LOG_FILE" 2>&1
    fi
fi

# 3. Instalar librerías necesarias
if [ -f "venv/bin/pip" ]; then
    echo "📥 Instalando pip y paquetes requeridos en venv..." >> "$LOG_FILE"
    venv/bin/pip install --upgrade pip >> "$LOG_FILE" 2>&1
    venv/bin/pip install pymysql cryptography python-dotenv >> "$LOG_FILE" 2>&1
    PYTHON_EXEC="venv/bin/python"
else
    echo "⚠️ venv/virtualenv no disponible. Intentando instalación con --user..." >> "$LOG_FILE"
    PYTHON_EXEC=$PYTHON_CMD
    
    # Comprobar comandos de pip disponibles
    if command -v pip3 &>/dev/null; then
        PIP_CMD="pip3"
    elif command -v pip &>/dev/null; then
        PIP_CMD="pip"
    else
        PIP_CMD="$PYTHON_CMD -m pip"
    fi
    
    echo "Usando comando de pip: $PIP_CMD" >> "$LOG_FILE"
    $PIP_CMD install --user pymysql cryptography python-dotenv >> "$LOG_FILE" 2>&1
fi

# 4. Ejecutar el script de migración leyendo desde JSON
echo "🚀 Ejecutando script import_json_to_mysql.py con $PYTHON_EXEC..." >> "$LOG_FILE"
$PYTHON_EXEC import_json_to_mysql.py >> "$LOG_FILE" 2>&1

echo "=== PROCESO DE MIGRACIÓN FINALIZADO ===" >> "$LOG_FILE"
