#!/bin/bash
# ==============================================================================
# SCRIPT DE COPIA DE SEGURIDAD AUTOMÁTICA DE MYSQL (PORTAL TRABAJO IT)
# ==============================================================================
# Realiza un volcado comprimido de la base de datos 'portal_empleo' y elimina
# automáticamente los respaldos con más de 7 días de antigüedad.
#
# Para programar ejecución diaria a las 03:00 AM en el servidor:
# crontab -e
# 0 3 * * * /var/www/proyecto_empleo/scripts/backup_mysql.sh >> /var/log/backup_mysql.log 2>&1
# ==============================================================================

set -euo pipefail
umask 077

# 1. Configuración de Base de Datos y Rutas (Fail-Closed: sin contraseñas por defecto)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../frontend/.env.local"

read_env_var() {
    local var_name="$1"
    if [ -f "$ENV_FILE" ]; then
        grep -E "^${var_name}=" "$ENV_FILE" | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true
    fi
}

DB_NAME="${DB_NAME:-$(read_env_var MYSQL_DATABASE)}"
DB_NAME="${DB_NAME:-portal_empleo}"
DB_USER="${DB_USER:-$(read_env_var MYSQL_USER)}"
DB_HOST="${DB_HOST:-$(read_env_var MYSQL_HOST)}"
DB_HOST="${DB_HOST:-localhost}"
DB_PASS="${DB_PASS:-$(read_env_var MYSQL_PASSWORD)}"

: "${DB_USER:?Error crítico: DB_USER/MYSQL_USER no configurado.}"
: "${DB_PASS:?Error crítico: DB_PASS/MYSQL_PASSWORD no configurado (se prohíben credenciales fallback).}"

# Archivo temporal seguro con permisos 0600 para no exponer la contraseña en ps aux / /proc
MYSQL_CNF_TEMP="$(mktemp)"
chmod 600 "$MYSQL_CNF_TEMP"
cleanup() {
    rm -f "$MYSQL_CNF_TEMP"
}
trap cleanup EXIT

cat > "$MYSQL_CNF_TEMP" <<EOF
[client]
user=${DB_USER}
password=${DB_PASS}
host=${DB_HOST}
EOF

BACKUP_DIR="${BACKUP_DIR:-/var/backups/proyecto_empleo/mysql}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RAW_ARCHIVE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"
FINAL_BACKUP="$RAW_ARCHIVE"

# 2. Asegurar que el directorio de copias existe y tiene permisos estrictos (0700)
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

echo "=========================================================="
echo "🕒 [$(date)] Iniciando copia de seguridad de '${DB_NAME}'..."

# 3. Ejecutar mysqldump con --defaults-extra-file y comprimir en streaming
mysqldump --defaults-extra-file="$MYSQL_CNF_TEMP" \
    --single-transaction \
    --quick \
    --routines \
    --triggers \
    "$DB_NAME" | gzip -9 > "$RAW_ARCHIVE"

chmod 600 "$RAW_ARCHIVE"

# Verificar integridad del stream gzip antes de continuar
gzip -t "$RAW_ARCHIVE"

# 4. Cifrado en reposo (obligatorio si se configura destinatario age o gpg)
if [ -n "${BACKUP_AGE_RECIPIENT:-}" ] && command -v age >/dev/null 2>&1; then
    age -r "$BACKUP_AGE_RECIPIENT" -o "${RAW_ARCHIVE}.age" "$RAW_ARCHIVE"
    rm -f "$RAW_ARCHIVE"
    FINAL_BACKUP="${RAW_ARCHIVE}.age"
    chmod 600 "$FINAL_BACKUP"
elif [ -n "${BACKUP_GPG_RECIPIENT:-}" ] && command -v gpg --version >/dev/null 2>&1; then
    gpg --batch --yes --trust-model always --encrypt --recipient "$BACKUP_GPG_RECIPIENT" --output "${RAW_ARCHIVE}.gpg" "$RAW_ARCHIVE"
    rm -f "$RAW_ARCHIVE"
    FINAL_BACKUP="${RAW_ARCHIVE}.gpg"
    chmod 600 "$FINAL_BACKUP"
else
    echo "⚠️ Aviso de seguridad: BACKUP_AGE_RECIPIENT / BACKUP_GPG_RECIPIENT no configurado; el backup permanece sin cifrado asimétrico en reposo."
fi

# Generar manifiesto de integridad SHA-256
sha256sum "$FINAL_BACKUP" > "${FINAL_BACKUP}.sha256"
chmod 600 "${FINAL_BACKUP}.sha256"

FILE_SIZE=$(du -h "$FINAL_BACKUP" | cut -f1)
echo "✅ Copia de seguridad completada y verificada: $FINAL_BACKUP ($FILE_SIZE)"

# 5. Replicación externa segura opcional (p. ej. rclone hacia S3/B2 cifrado)
if [ -n "${BACKUP_REMOTE_DEST:-}" ] && command -v rclone >/dev/null 2>&1; then
    rclone copy "$FINAL_BACKUP" "$BACKUP_REMOTE_DEST"
    rclone copy "${FINAL_BACKUP}.sha256" "$BACKUP_REMOTE_DEST"
    echo "☁️ Copia replicada en destino externo: $BACKUP_REMOTE_DEST"
fi

# 6. Política de retención: Eliminar respaldos y manifiestos con más de 7 días
echo "🧹 Limpiando copias de seguridad de más de 7 días..."
find "$BACKUP_DIR" -type f \( -name "${DB_NAME}_*.sql.gz" -o -name "${DB_NAME}_*.sql.gz.age" -o -name "${DB_NAME}_*.sql.gz.gpg" -o -name "${DB_NAME}_*.sha256" \) -mtime +7 -delete

echo "📊 Estado del directorio de backups:"
ls -lh "$BACKUP_DIR"
echo "=========================================================="

