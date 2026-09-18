#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE BACKUP AUTOMATIZADO DE BASE DE DATOS - SUMAQ SPA (LINUX / UNIX)
# ==============================================================================

DB_NAME="${DB_NAME:-sumaq_spa}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASSWORD:-}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/backups"
mkdir -p "${BACKUP_DIR}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/sumaq_spa_backup_${TIMESTAMP}.sql.gz"

echo "========================================================"
echo "  GENERANDO COPIA DE SEGURIDAD: ${DB_NAME}"
echo "  Destino: ${BACKUP_FILE}"
echo "========================================================"

if [ -z "${DB_PASS}" ]; then
    mysqldump -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" \
        --single-transaction --quick --routines --triggers --events "${DB_NAME}" | gzip > "${BACKUP_FILE}"
else
    mysqldump -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASS}" \
        --single-transaction --quick --routines --triggers --events "${DB_NAME}" | gzip > "${BACKUP_FILE}"
fi

if [ $? -eq 0 ]; then
    echo "[OK] Copia de seguridad generada exitosamente: ${BACKUP_FILE}"
    # Retención: eliminar backups con más de 30 días
    find "${BACKUP_DIR}" -name "sumaq_spa_backup_*.sql.gz" -mtime +30 -delete
else
    echo "[ERROR] Falló la generación del backup."
fi
