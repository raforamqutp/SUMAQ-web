#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE RESTAURACIÓN DE BASE DE DATOS - SUMAQ SPA (LINUX / UNIX)
# Uso: ./restore_db.sh <ruta_archivo_sql_o_sql_gz>
# ==============================================================================

DB_NAME="${DB_NAME:-sumaq_spa}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASSWORD:-}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"

if [ -z "$1" ]; then
    echo "[ERROR] Debe especificar el archivo SQL o .sql.gz a restaurar."
    echo "Uso: $0 backups/sumaq_spa_backup_YYYYMMDD_HHMMSS.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "[ERROR] El archivo no existe: ${BACKUP_FILE}"
    exit 1
fi

echo "========================================================"
echo "  RESTAURANDO BASE DE DATOS: ${DB_NAME}"
echo "  Desde: ${BACKUP_FILE}"
echo "========================================================"

AUTH_FLAG=""
if [ -n "${DB_PASS}" ]; then
    AUTH_FLAG="-p${DB_PASS}"
fi

mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" ${AUTH_FLAG} \
    -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if [[ "${BACKUP_FILE}" == *.gz ]]; then
    gunzip -c "${BACKUP_FILE}" | mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" ${AUTH_FLAG} "${DB_NAME}"
else
    mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" ${AUTH_FLAG} "${DB_NAME}" < "${BACKUP_FILE}"
fi

if [ $? -eq 0 ]; then
    echo "[OK] Restauración completada exitosamente."
else
    echo "[ERROR] Ocurrió un error durante la restauración."
fi
