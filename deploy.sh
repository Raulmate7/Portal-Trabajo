#!/bin/bash

# =====================================================================
# Script de Despliegue Automatizado para Portal Trabajo IT en VPS
# =====================================================================

# Detener el script si ocurre un error
set -e

echo "🚀 Iniciando despliegue de Portal Trabajo IT..."
echo "================================================="

# 1. Obtener última versión del código
echo "📥 Descargando últimos cambios desde GitHub..."
git pull origin main

# 1.5. Sincronizar esquema MySQL automáticamente (idempotente)
echo "🗄️ Sincronizando esquema de base de datos..."
if [ -x "backend/venv/bin/python3" ]; then
    backend/venv/bin/python3 backend/consolidate_production_schema.py || echo "⚠️ Aviso: No se pudo ejecutar consolidate_production_schema.py (verifica credenciales MySQL directas en backend/.env)."
elif command -v python3 >/dev/null 2>&1; then
    python3 backend/consolidate_production_schema.py || echo "⚠️ Aviso: No se pudo ejecutar consolidate_production_schema.py."
fi

# 2. Configurar y compilar el Frontend
echo "💻 Preparando el Frontend..."
cd frontend

echo "📦 Instalando dependencias..."
npm install

echo "🛠️ Compilando aplicación Next.js para producción..."
npm run build

# 3. Levantar/Recargar con PM2
echo "🔄 Actualizando proceso en PM2..."

# Comprobar si la aplicación ya está registrada en PM2
if pm2 show portal-trabajo > /dev/null 2>&1; then
    echo "⚡ La aplicación ya está corriendo. Recargando de forma segura (Zero-Downtime)..."
    pm2 reload portal-trabajo
else
    echo "⚡ Primera ejecución. Registrando e iniciando aplicación en PM2..."
    pm2 start npm --name "portal-trabajo" -- run start
fi

# Guardar la lista de procesos de PM2 para que se inicien tras reinicios del servidor
pm2 save

# SEC-058: Verificación de salud post-despliegue
sleep 2
if ! curl -sf http://127.0.0.1:3000/ > /dev/null; then
    echo "❌ Error: El servidor Next.js no responde tras el despliegue. Revisa 'pm2 logs portal-trabajo'."
    exit 1
fi

echo "================================================="
echo "✅ ¡Despliegue completado con éxito!"
echo "Tu web ya está corriendo en http://localhost:3000 y gestionada por Nginx."
